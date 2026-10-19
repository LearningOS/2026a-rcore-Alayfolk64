TARGET := riscv64gc-unknown-none-elf
APP_ELF := target/$(TARGET)/release/bare-metal-hello
APP_BIN := $(APP_ELF).bin
RUSTSBI := bootloader/rustsbi-qemu.bin

.PHONY: build run disasm clean

build:
	cargo build --release
	rust-objcopy --strip-all -O binary $(APP_ELF) $(APP_BIN)

run: build
	qemu-system-riscv64 \
		-machine virt \
		-nographic \
		-smp 1 \
		-bios $(RUSTSBI) \
		-device loader,file=$(APP_BIN),addr=0x80200000

disasm: build
	rust-objdump -d $(APP_ELF)

clean:
	cargo clean
