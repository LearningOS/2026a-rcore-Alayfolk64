//! Process management syscalls
use crate::task::{change_program_brk, exit_current_and_run_next, suspend_current_and_run_next};
use crate::timer::get_time_us;
use crate::task::{current_user_token, current_syscall_count, mmap, munmap};
use crate::mm::{translated_byte_buffer, MapPermission};
use crate::config::PAGE_SIZE;

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
    let time_ms = get_time_us();
    let sec = time_ms / 1_000_000;
    let usec = time_ms % 1_000_000;
    let token = current_user_token();
    let sec_ptr = translated_byte_buffer(token, ts as *const u8, core::mem::size_of::<usize>());
    let usec_ptr = translated_byte_buffer(token, unsafe { (ts as *const u8).add(1) }, core::mem::size_of::<usize>());
    let sec_ptr = sec_ptr[0][0] as *mut usize;
    let usec_ptr = usec_ptr[0][0] as *mut usize;
    unsafe {
        *sec_ptr = sec;
        *usec_ptr = usec;
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
            let result = translated_byte_buffer(token, id as *const u8, core::mem::size_of::<u8>());
            let result = result[0][0];
            result as isize
        },
        1 => {
            let token = current_user_token();
            let mut result = translated_byte_buffer(token, id as *const u8, core::mem::size_of::<u8>());
            result[0][0] = data as u8;
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
