use core::arch::asm;

fn console_putchar(byte: u8) {
    unsafe {
        asm!(
            "ecall",
            in("a7") 1usize,
            in("a6") 0usize,
            inlateout("a0") byte as usize => _,
            options(nostack),
        );
    }
}

pub fn put_str(text: &str) {
    // SBI 只提供了输出单个字符的功能，因此这里需要使用循环
    for byte in text.bytes() {
        console_putchar(byte);
    }
}

pub fn shutdown(failed: bool) -> ! {
    // SBI 系统重置：a7 = SRST，a6 = 0，a0 = 0 表示关机，
    // a1 = 0 表示正常关机，1 表示系统故障。调用成功后不会返回。
    unsafe {
        asm!(
            "ecall",
            in("a7") 0x53525354usize,
            in("a6") 0usize,
            inlateout("a0") 0usize => _,
            inlateout("a1") failed as usize => _,
            options(nostack),
        );
    }
    loop {}
}
