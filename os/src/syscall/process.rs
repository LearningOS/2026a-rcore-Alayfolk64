//! Process management syscalls
use crate::task::{change_program_brk, exit_current_and_run_next, suspend_current_and_run_next};
use crate::timer::get_time_us;
use crate::task::{current_user_token, current_syscall_count, mmap, munmap};
use crate::mm::{MapPermission, PTEFlags, PageTable, VirtAddr, VirtPageNum, translated_byte_buffer};
use crate::config::{PAGE_SIZE, PAGE_SIZE_BITS};

#[repr(C)]
#[derive(Debug)]
pub struct TimeVal {
    pub sec: usize,
    pub usec: usize,
}

/// task exits and submit an exit code
pub fn sys_exit(_exit_code: i32) -> ! {
    trace!("kernel: sys_exit");
    exit_current_and_run_next();
    panic!("Unreachable in sys_exit!");
}

/// current task gives up resources for other tasks
pub fn sys_yield() -> isize {
    trace!("kernel: sys_yield");
    suspend_current_and_run_next();
    0
}

/// YOUR JOB: get time with second and microsecond
/// HINT: You might reimplement it with virtual memory management.
/// HINT: What if [`TimeVal`] is splitted by two pages ?
pub fn sys_get_time(ts: *mut TimeVal, _tz: usize) -> isize {
    trace!("kernel: sys_get_time");
    let time_us = get_time_us();
    let sec = time_us / 1_000_000;
    let usec = time_us % 1_000_000;

    let size = core::mem::size_of::<usize>();
    let token = current_user_token();
    let sec_ptr = ts as usize;
    let usec_ptr = sec_ptr + size;

    let sec_va: VirtAddr = sec_ptr.into();
    let usec_va: VirtAddr = usec_ptr.into();

    let sec_vpn: VirtPageNum = sec_va.floor();
    let usec_vpn: VirtPageNum = usec_va.floor();

    let pt = PageTable::from_token(token);
    let sec_ppn = pt.translate(sec_vpn).unwrap().ppn();
    let usec_ppn = pt.translate(usec_vpn).unwrap().ppn();

    let sec_pa = ((sec_ppn.0 << PAGE_SIZE_BITS) | (sec_ptr & (PAGE_SIZE - 1))) as *mut usize;
    let usec_pa = ((usec_ppn.0 << PAGE_SIZE_BITS) | (usec_ptr & (PAGE_SIZE - 1))) as *mut usize;

    unsafe {
        *sec_pa = sec;
        *usec_pa = usec;
    }
    0

}

/// TODO: Finish sys_trace to pass testcases
/// HINT: You might reimplement it with virtual memory management.
pub fn sys_trace(trace_request: usize, id: usize, data: usize) -> isize {
    trace!("kernel: sys_trace");
    match trace_request {
        0 => {
            let token = current_user_token();
            let pt = PageTable::from_token(token);
            let va: VirtAddr = id.into(); 
            let vpn : VirtPageNum = va.floor();
            let pte = match pt.translate(vpn) {
                Some(pte) => pte,
                None => return -1,
            };
            if !pte.is_valid() || !pte.flags().contains(PTEFlags::U) || !pte.flags().contains(PTEFlags::R) {
                return -1;
            }
            let result = translated_byte_buffer(token, id as *const u8, core::mem::size_of::<u8>());
            let ptr = result[0].as_ptr() as *const u8;
            unsafe {
                *ptr as isize
            }
        },
        1 => {
            let token = current_user_token();
            let pt = PageTable::from_token(token);
            let va: VirtAddr = id.into(); 
            let vpn : VirtPageNum = va.floor();
            let pte = match pt.translate(vpn) {
                Some(pte) => pte,
                None => return -1,
            };
            if !pte.is_valid() || !pte.flags().contains(PTEFlags::U) || !pte.flags().contains(PTEFlags::W) {
                return -1;
            }
            let mut result = translated_byte_buffer(token, id as *const u8, core::mem::size_of::<u8>());
            
            let ptr = result[0].as_mut_ptr() as *mut u8;
            unsafe {
                *ptr = data as u8;
            }
            0
        },
        2 => {
            current_syscall_count(id) as isize
        },
        _ => {
            -1
        }
    }
}

// YOUR JOB: Implement mmap.
pub fn sys_mmap(start: usize, len: usize, port: usize) -> isize {
    trace!("kernel: sys_mmap!");
    if port & 0x7 == 0 || port & !(0x7) != 0 {
        return -1;
    } 
    if start & (PAGE_SIZE - 1) != 0 {
        return -1;
    }
    let readable = port & (1 << 0) != 0;
    let writable = port & (1 << 1) != 0;
    let executable = port & (1 << 2) != 0;
    let mut perm: MapPermission = MapPermission::U;
    if readable {
        perm |= MapPermission::R;
    }
    if writable {
        perm |= MapPermission::W;
    }
    if executable {
        perm |= MapPermission::X;
    }
    let end = start + len;
    if mmap(start, end, perm) {
        return 0;
    } else {
        return -1;
    }
}

// YOUR JOB: Implement munmap.
pub fn sys_munmap(start: usize, len: usize) -> isize {
    trace!("kernel: sys_munmap!");
    if start % PAGE_SIZE != 0 {
        return -1;
    }
    let end = start + len;
    if munmap(start, end) {
        return 0;
    } else {
        return -1;
    }
}
/// change data segment size
pub fn sys_sbrk(size: i32) -> isize {
    trace!("kernel: sys_sbrk");
    if let Some(old_brk) = change_program_brk(size) {
        old_brk as isize
    } else {
        -1
    }
}
