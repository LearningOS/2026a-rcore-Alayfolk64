#![no_std]
#![no_main]

use core::arch::global_asm;
use core::panic::PanicInfo;

mod sbi;

global_asm!(include_str!("entry.asm"));

#[no_mangle]
pub extern "C" fn rust_main() -> ! {
    sbi::put_str("\nHello, world!\n\n");
    sbi::shutdown(false)
}

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    sbi::put_str("panic: bare metal app failed.\n");
    sbi::shutdown(true)
}
