# Bare Metal Hello World

一个直接由 RustSBI 启动的 RISC-V 裸机应用。应用在 S 态运行，自行设置栈，并通过 SBI 接口输出 `Hello, world!` 和关机。

启动链：

```text
QEMU virt → RustSBI（M 态）→ app @ 0x80200000（S 态）
                            → 设置 sp → rust_main → 输出 → 关机
```

## 编译与运行

需要 Rustup、Make、支持 RISC-V 的 QEMU 和 `cargo-binutils`。`rust-toolchain.toml` 指定 Rust 工具链、裸机目标和 LLVM 工具组件。

在仓库根目录执行：

```sh
make run
```

`run` 会编译应用、生成裸二进制，再启动 QEMU。RustSBI 的启动信息后会出现 `Hello, world!`，随后 QEMU 正常退出。

其他入口：

- `make build`：只编译，生成 `target/riscv64gc-unknown-none-elf/release/bare-metal-hello.bin`。
- `make disasm`：编译并显示应用的反汇编。
- `make clean`：清理当前应用的构建产物。

修改 `src/linker.ld` 后，先执行 `make clean`，再执行 `make run`，确保重新链接。

## 启动方式

`make run` 使用下面的命令直接加载应用：

```sh
qemu-system-riscv64 \
    -machine virt \
    -nographic \
    -smp 1 \
    -bios bootloader/rustsbi-qemu.bin \
    -device loader,file=target/riscv64gc-unknown-none-elf/release/bare-metal-hello.bin,addr=0x80200000
```

`-machine virt` 选择虚拟开发板，`-nographic` 将串口输出放到终端，`-smp 1` 使用一个核。`-bios` 加载 RustSBI；`-device loader` 把应用二进制放到 `0x80200000`，由 RustSBI 跳转到该入口。整个过程不加载操作系统内核。

## 代码结构

| 文件 | 作用 |
| --- | --- |
| `src/entry.asm` | 设置 `sp`，调用 `rust_main` |
| `src/linker.ld` | 从 `0x80200000` 开始依次放置代码段 `.text`、只读数据段 `.rodata`，随后预留 16 KiB、16 字节对齐的栈 |
| `src/main.rs` | `no_std` / `no_main` 入口、Hello World 和最小 panic 处理 |
| `src/sbi.rs` | 通过 `ecall` 调用 SBI 字符输出和 System Reset 关机接口 |
| `.cargo/config` | 指定裸机目标，通过 `rustflags` 指定链接脚本 |
| `bootloader/` | RustSBI 固件、来源记录和许可证 |

运行时使用 `.text`、`.rodata` 和 `.stack`，分别存放代码、字符串等只读常量和栈。当前程序没有可写全局变量，因此不需要独立的 `.data`、`.bss` 或 BSS 清零。栈使用 `NOLOAD` 预留，只占运行时内存，不增加 `.bin` 文件大小。最小 panic 处理会输出固定错误提示，并请求失败关机；它不承担硬件异常的 Trap 处理。

固件使用 RustSBI-QEMU `0.2.0-alpha.3`（RustSBI `0.4.0-alpha.1`），下载来源、版本和 SHA-256 见 [bootloader/NOTICE](bootloader/NOTICE)，固件许可证见 [bootloader/LICENSE](bootloader/LICENSE)。
