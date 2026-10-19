import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const runtime = '/Users/wuxun/.cache/codex-runtimes/codex-primary-runtime/dependencies';
process.env.RUNTIME_NODE_MODULES = path.join(runtime, 'node/node_modules');
const skill = '/Users/wuxun/.codex/plugins/cache/openai-primary-runtime/presentations/26.1015.12040/skills/presentations';
const { Presentation, PresentationFile, FileBlob } = await import(pathToFileURL(path.join(runtime, 'node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs')).href);
const { finalizePresentation } = await import(pathToFileURL(path.join(skill, 'container_tools/artifact_tool_utils.mjs')).href);
const build = path.join(root, 'tmp/lecture-build');
const out = path.join(root, 'lecture/output');
await fs.mkdir(build, { recursive: true });
await fs.mkdir(out, { recursive: true });

const C = { bg:'#F7F5EF', ink:'#193F3A', body:'#354D47', muted:'#718078', teal:'#317A70', coral:'#CF6B51', mint:'#E2EDE6', peach:'#F6E6DC', white:'#FFFFFF', rule:'#CFDAD2' };
const FONT = 'Arial Unicode MS';
const MONO = 'Menlo';
const p = Presentation.create({ slideSize: { width:1280, height:720 } });
const records = [];
const tableSlides = [];
const repository = 'https://github.com/LearningOS/2026a-rcore-Alayfolk64';
const sha = { bare:'c32aabf6a6facdf3998b7799ac10818ff713e23a', ch1:'8f1dbd3ba6895dafb145d938d965ba7cac2ccc82', ch2:'cf94475a8afdcc3068a839bdfb0f0392491d4f5a', ch3:'3b9f7dd039dfee39b4e92cd80e5a52dece2b6f39' };
const source = (branch, file) => `${repository}/blob/${sha[branch]}/${file}`;
const guide = {
 bare:'https://learningos.cn/rCore-Tutorial-Guide/chapter1/4mini-rt-baremetal.html',
 batch:'https://learningos.cn/rCore-Tutorial-Guide/chapter2/3batch-system.html',
 trap:'https://learningos.cn/rCore-Tutorial-Guide/chapter2/4trap-handling.html',
 time:'https://learningos.cn/rCore-Tutorial-Guide/chapter3/4time-sharing-system.html'
};

function text(s, value, x, y, w, h, size=32, color=C.body, opts={}) {
  const shape = s.shapes.add({ name:opts.name ?? `text-${s.shapes.items.length}`, geometry:'textbox', position:{left:x,top:y,width:w,height:h}, fill:'none', line:{fill:'none',width:0} });
  shape.text = value;
  shape.text.style = { typeface:opts.mono ? MONO : FONT, fontSize:size, color, bold:opts.bold ?? false, insets:0, wrap:opts.wrap ?? 'square', autoFit:'none', alignment:opts.align ?? 'left', verticalAlignment:'top' };
  return shape;
}
function slide(title, minutes, notes, sources=[], bg=C.bg) {
  const s=p.slides.add(); s.background.fill=bg;
  const n=p.slides.items.length;
  if(title) text(s,title,72,48,1136,88,44,C.ink,{bold:true,name:'slide-title'});
  text(s,String(n),1174,665,40,26,18,C.muted,{align:'right'});
  records.push({number:n,title,minutes,notes,sources});
  s.speakerNotes.text=`建议用时：${minutes} 分钟\n\n${notes}\n\n来源：\n${sources.length ? sources.join('\n') : '广告屏情境由讲师提供，时间与广告内容均为教学设定。'}`;
  return s;
}
function code(s, lines, x=82, y=190, w=1110, size=30) {
  return text(s,lines,x,y,w,lines.split('\n').length*(size*1.5)+20,size,C.ink,{mono:true});
}
function caption(s,value,y=596,color=C.muted){ text(s,value,74,y,1110,48,26,color); }
function table(s,values,x=74,y=180,w=1132,h=350,widths,opts={}){
  const t=s.tables.add({rows:values.length,columns:values[0].length,left:x,top:y,width:w,height:h,columnWidths:widths,values});
  t.borders.assign({fill:C.rule,width:0.7,style:'solid'});
  for(let r=0;r<values.length;r++) for(let c=0;c<values[0].length;c++) {
    const cell=t.getCell(r,c);
    cell.fill = r===0 && opts.header!==false ? C.mint : (opts.fills?.[r]?.[c] ?? C.bg);
    cell.text.style={typeface:FONT,fontSize:opts.size ?? 30,color:r===0?C.ink:C.body,bold:r===0 && opts.header!==false,verticalAlignment:'middle',alignment:opts.center?'center':'left',insets:{left:18,right:14,top:10,bottom:10},autoFit:'none'};
  }
  tableSlides.push(p.slides.items.length);
  return t;
}
async function picture(s,file,x,y,w,h){
  const bytes=await fs.readFile(path.join(root,'lecture/assets',file));
  s.images.add({blob:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),contentType:'image/png',alt:file==='ad-screen.png'?'广告屏、主板与程序卡片的教学插图':'等待换程序卡片的操作员教学插图',fit:'contain',position:{left:x,top:y,width:w,height:h}});
}

// 1–10: 20 minutes, including a four-minute live demonstration.
{
 const s=slide('',1,'开场直接讲广告屏的故事：先让一台机器显示一句话，再面对换广告、自动换程序和公平分配播放机会的需求。今天用这个故事理解前三章的设计动机。全课 60 分钟，包含 4 分钟裸机演示和最后 5 分钟提问。插图是教学情境，不对应实际硬件型号。');
 await picture(s,'ad-screen.png',485,114,790,526);
 text(s,'OpenCamp 2026 秋冬季',74,84,640,40,28,C.teal);
 text(s,'一块广告屏里的\n操作系统',72,216,670,192,66,C.ink,{bold:true});
 text(s,'专业阶段第一课',76,472,500,50,32,C.body);
 text(s,'裸机应用 / 批处理 / 分时多任务',76,540,760,46,26,C.muted);
 records[0].title='一块广告屏里的操作系统';
}
{
 const s=slide('今天的三次改造',1,'用需求组织课程，不要求同学此刻记住寄存器。第一章回答如何运行程序，第二章回答如何自动运行下一项并通过特权机制管理应用，第三章回答如何暂停、恢复并分配 CPU。广告屏只是帮助理解机制的情境，实际演示使用串口文本。',[guide.bare,guide.batch,guide.time]);
 table(s,[['需求','新增能力'],['先显示一句话','基本执行环境'],['一批广告自动运行','批处理与特权切换'],['广告轮流获得机会','任务切换与时钟抢占']],74,180,1132,380,[520,612]);
}
{
 const s=slide('第一位客户：显示一句话',1,'先把目标压到最小：这就是一个应用，暂时没有操作系统。屏幕用 QEMU 串口代替。只要程序放到约定的地址、有合法栈，并能调用固件的输出服务，就可以运行。下一页追踪是谁把控制权交给它。',[source('bare','src/main.rs')]);
 text(s,'Hello, world!',76,230,1130,125,82,C.teal,{mono:true});
 text(s,'一个应用，一台机器',79,432,1000,68,38,C.body);
 caption(s,'课堂演示用串口输出代替广告屏');
}
{
 const s=slide('裸机应用的启动顺序',2,'QEMU virt 提供虚拟硬件。复位引导代码将控制权交给位于 0x80000000 的 RustSBI。这里采用的固件在初始化后进入 S 态的 0x80200000，执行我们的 _start。强调：这个地址来自本次平台和固件约定，不是任意 RISC-V 机器的通用入口。当前应用直接运行在 S 态，尚无 U 态应用与 OS 的分层。',[source('bare','Makefile'),source('bare','bootloader/NOTICE'),guide.bare]);
 table(s,[['启动阶段','执行内容','位置'],['① 机器启动','QEMU virt 复位引导','虚拟硬件'],['② 固件初始化','RustSBI，M 态','0x80000000'],['③ 应用运行','_start，S 态','0x80200000']],74,182,1132,360,[320,420,392],{size:29});
 caption(s,'本次启动约定：链接地址与加载地址保持一致');
}
{
 const s=slide('编译、转换、加载',2,'第一条命令编译并链接，生成 ELF，其中有代码、只读数据和描述文件的元信息。objcopy 将需要加载的内容转成裸二进制，--strip-all 去掉符号及调试信息，-O binary 选择裸二进制。页上的 app.elf 和 app.bin 是便于讲解的文件名，仓库实际路径由 APP_ELF 与 APP_BIN 指定。之后 QEMU loader 将 .bin 放到 0x80200000。不要把 ELF 头当作第一条指令。',[source('bare','Makefile')]);
 code(s,'cargo build --release\nrust-objcopy --strip-all -O binary app.elf app.bin',78,190,1140,27);
 table(s,[['ELF','裸二进制 .bin'],['代码 + 数据 + 文件描述信息','按加载地址排列的内容']],74,375,1132,164,[566,566],{size:28});
 caption(s,'QEMU 将 .bin 放到 0x80200000');
}
{
 const s=slide('进入 Rust 之前，先设置栈',3,'在 0x80200000 执行的第一段是汇编入口。la 将链接脚本中的 boot_stack_top 地址放入 sp，call 再调用 Rust 入口。Rust 函数可能保存寄存器、分配局部变量，所以栈必须先有效。RISC-V 常用栈向低地址增长，此处栈顶按 16 字节对齐。ENTRY(_start) 记录 ELF 入口，.text.entry 排在最前才保证裸二进制开头是入口代码。',[source('bare','src/entry.asm'),source('bare','src/linker.ld')]);
 code(s,'_start:\n    la sp, boot_stack_top\n    call rust_main',84,206,1080,40);
 text(s,'sp 指向预留栈的高地址端',84,458,1050,62,36,C.teal);
 caption(s,'栈空间 16 KiB，栈顶 16 字节对齐');
}
{
 const s=slide('最小应用的内存布局',2,'按从低地址到高地址读表。代码在 .text，Hello 字符串在 .rodata，随后对齐并预留 16 KiB 栈。此演示没有需要清零的可写全局变量，因此没有加入 BSS 清零。NOLOAD 让栈只占运行时地址空间，不成为末尾文件内容。若学生问能否删除，回答可以运行，但当前链接器会增大裸二进制。不要把这种最小布局推广到有静态变量或更多库的程序。',[source('bare','src/linker.ld'),'https://lld.llvm.org/ELF/linker_script.html#output-section-type']);
 table(s,[['从低地址到高地址','内容'],['.text   @ 0x80200000','入口与函数代码'],['.rodata','Hello, world! 字符串'],['.stack   16 KiB','函数调用需要的栈']],74,184,1132,355,[560,572],{size:31});
 caption(s,'NOLOAD：预留地址，不保存栈的初始内容');
}
{
 const s=slide('输出服务一次接收一个字符',3,'展示最小输出路径：put_str 对字符串逐字节循环，console_putchar 将字符放入 a0，以 a7=1 发起 legacy SBI Console Putchar。ecall 从 S 态进入 M 态的 RustSBI，固件操作串口，再返回应用继续下一个字节。这里演示 ASCII Hello World。当前 bare-metal-hello 分支的旧固件对非 ASCII 有已知限制，因此不在这次演示里扩展中文输出。inline asm 同时声明寄存器输入输出约束；屏幕上的三行是寄存器含义的简写，不是完整 Rust 源码。',[source('bare','src/sbi.rs')]);
 code(s,'for byte in text.bytes() {\n    console_putchar(byte);\n}',82,190,1040,35);
 table(s,[['a7 = 1','a0 = byte','ecall'],['选择字符输出','传入一个字节','请求 RustSBI']],74,405,1132,148,[377,377,378],{size:28,center:true});
}
{
 const s=slide('关机也是一次服务调用',1,'本程序使用 SBI System Reset 扩展，不使用旧版编号 8 的关机接口。a7 的 0x53525354 是 SRST，a6=0 选择 system_reset，a0=0 表示 shutdown，a1=0 表示正常结束，a1=1 表示系统故障。成功关机不会返回。后面的无限循环只是防止接口失败返回后 Rust 的永不返回函数落空，主流程应直接让 QEMU 正常退出。',[source('bare','src/sbi.rs')]);
 table(s,[['寄存器','正常关机参数'],['a7','0x53525354  /  SRST'],['a6','0  /  system_reset'],['a0','0  /  shutdown'],['a1','0  /  正常结束']],74,170,1132,370,[310,822],{size:30});
 caption(s,'调用成功后不再返回',588,C.teal);
}
{
 const s=slide('现场演示：裸机 Hello World',4,'在 bare-metal-hello 分支的仓库根目录执行 make run，观察固件信息、Hello World 和退出码。指向 src/main.rs、entry.asm、linker.ld、sbi.rs 四个文件即可，不逐行展开 Makefile。no_std 去除对标准库的依赖，no_main 由自定义入口接管启动，panic_handler 负责最小错误处理。当前 bare-metal 分支固件为 RustSBI 0.4.0-alpha.1，ch1 新模板固件为 0.4.1，两者均已在本机验证。分支切换会改变被跟踪的固件文件；演示前确认仓库状态。预期输出 Hello, world! 后正常退出。',[source('bare','src/main.rs'),source('bare','Makefile'),source('ch1','bootloader/rustsbi-qemu.toml')]);
 code(s,'pub extern "C" fn rust_main() -> ! {\n    sbi::put_str("\\nHello, world!\\n\\n");\n    sbi::shutdown(false)\n}',80,174,1130,29);
 text(s,'make run',82,430,500,72,48,C.teal,{mono:true});
 caption(s,'看到 Hello, world!，随后正常关机');
}

// 11–16: 14 minutes, common environment and batch execution.
{
 const s=slide('ch1：公共执行环境',2,'回到广告卡片。每次换广告，都带上同样的启动与设备访问代码，很容易想到把公共能力留在机器上。这是故事中的设计动机。严格对应源码，ch1 建立的是最小 S 态执行环境，业务与支持代码仍可一起链接，还没有完整的独立应用加载和系统调用隔离。RustSBI 始终是更底层的 M 态固件，不把新抽出的公共代码也叫作 RustSBI。应用与内核的明确分离接着由 ch2 完成。',[source('ch1','os/src/main.rs'),source('ch1','os/src/console.rs'),guide.bare]);
 text(s,'广告内容经常更换',80,206,1100,76,48,C.coral,{bold:true});
 text(s,'启动和设备服务可以复用',80,330,1110,80,46,C.teal,{bold:true});
 caption(s,'先建立最小执行环境，再分离应用与内核');
}
{
 const s=slide('老板想省掉换卡的人力',1,'沿用讲师的设定：一个广告程序运行三小时，员工只在更换程序时忙十分钟，其他时间等下一次换卡。三小时和十分钟是业务故事的假设，不是系统性能数据。老板的要求很直接：把接下来要播的程序一次性交给机器，由机器接着运行。引出批处理。');
 await picture(s,'operator.png',475,166,790,527);
 text(s,'3 小时',78,208,510,100,66,C.teal,{bold:true});
 text(s,'一次广告周期',81,312,480,50,29,C.body);
 text(s,'10 分钟',78,420,510,96,62,C.coral,{bold:true});
 text(s,'一次人工换程序',81,518,480,50,29,C.body);
}
{
 const s=slide('ch2：一次装入，依次运行',2,'一批程序镜像可以一开始就作为内核的数据带入机器。运行完当前应用，再选择并加载下一项，所以无需每三小时有人现场操作。此时的关键仍是先后顺序：前一个不结束，后一个就没有运行机会。把完成后的自动换程序与稍后会讲的暂停后恢复区分开。',[source('ch2','os/src/batch.rs'),guide.batch]);
 table(s,[['第一个时段','第二个时段','第三个时段'],['广告 A','广告 B','广告 C'],['运行至结束','运行至结束','运行至结束']],74,216,1132,263,[377,377,378],{size:33,center:true});
 caption(s,'结束一个，再加载下一个',568,C.teal);
}
{
 const s=slide('批处理复用同一块运行区域',3,'ch2 的程序镜像都能保存在内核中，但应用的运行位置只有一块。load_app 清空 APP_BASE_ADDRESS 开始的区域，把下一项复制进去，执行 fence.i，再构造新的应用上下文。run_next_app 更新索引并进入 U 态。表中 A、B、C 是三个不同时间的状态，不表示三个程序同时占同一地址。fence.i 保证后续取指能看到先前写入的新指令。',[source('ch2','os/src/batch.rs')]);
 text(s,'0x80400000',78,174,1130,90,66,C.teal,{mono:true});
 table(s,[['运行顺序','同一地址里放什么'],['第 1 项','应用 A'],['第 2 项','应用 B 覆盖 A'],['第 3 项','应用 C 覆盖 B']],74,306,1132,250,[340,792],{size:29});
 caption(s,'load_app：清空、复制、fence.i');
}
{
 const s=slide('应用与管理者有不同权限',3,'现在把广告程序放在 U 态，管理它们的内核放在 S 态，固件继续在 M 态。应用要使用服务就通过系统调用进入内核。遇到非法指令等异常，处理器也会进入预设的 Trap 入口。特权级能限制某些操作，但不能把这一步说成完整的地址空间隔离；本课程用页表建立每个应用的地址空间是 ch4 的内容。也不能说所有故障都会自动被处理，未支持的 Trap 仍可能令教学内核 panic。',[source('ch2','os/src/trap/context.rs'),source('ch2','os/src/trap/mod.rs'),guide.trap]);
 table(s,[['权限层级','运行内容','承担的工作'],['U 态','广告应用','执行广告逻辑'],['S 态','批处理内核','管理应用与处理 Trap'],['M 态','RustSBI','提供底层固件服务']],74,184,1132,350,[270,390,472],{size:29});
 caption(s,'独立地址空间留到 ch4');
}
{
 const s=slide('一次系统调用的往返',3,'先以 U 态应用请求写字符串为例。ecall 触发同步异常，硬件记录返回位置和原因，入口汇编再把通用寄存器保存到 TrapContext，并切换到内核所需的栈。trap_handler 识别 UserEnvCall，分派系统调用，返回值写回 a0。系统调用的 sepc 要加 4，跳过本次 ecall，随后恢复上下文并 sret 返回 U 态。定时器中断不应机械地把 sepc 加 4。此处区分 U 到 S 的系统调用与前面 S 到 M 的 SBI 调用。',[source('ch2','os/src/trap/mod.rs'),source('ch2','os/src/trap/context.rs'),guide.trap]);
 table(s,[['顺序','发生什么'],['① U 态应用','ecall 请求服务'],['② Trap 入口','保存寄存器与返回位置'],['③ S 态内核','处理请求，写回结果'],['④ 返回应用','恢复上下文，sret']],74,177,1132,385,[340,792],{size:30});
 caption(s,'TrapContext 保存被打断时的应用现场');
}

// 17–23: 16 minutes, multiprogramming and time sharing.
{
 const s=slide('自动运行，还不够公平',2,'老板解决了人工换卡，但客户有新的抱怨：前三个小时一直是同一条广告，后面的客户只能等，深夜时段也难卖。新的业务规则是每五分钟轮换一条，原来每位客户累计三小时的额度可以分散兑现。此时应用可能尚未完成，需要暂停后继续。先明确业务播放周期与 CPU 调度时间片是不同尺度；这里用广告轮播提出公平性和可恢复执行的需求。');
 text(s,'连续 3 小时',78,198,1120,100,64,C.coral,{bold:true});
 text(s,'改为每 5 分钟轮播',78,338,1120,94,55,C.teal,{bold:true});
 caption(s,'热门时段也能轮到不同客户');
}
{
 const s=slide('ch3：多个程序同时驻留',2,'若切回 A 时仍想保留进度，就不能每次都用 B 覆盖 A 的运行区域。ch3 在物理内存中给各应用划定不同区域并分别准备栈和上下文。当前代码 APP_BASE_ADDRESS 为 0x80400000，APP_SIZE_LIMIT 为 0x20000，因此前三个区域按表中地址排列。多道程序意味着多个程序驻留；在这堂课的单核模型中，同一时刻仍只有一个任务占用 CPU。此处仍没有 ch4 的每进程页表隔离。',[source('ch3','os/src/loader.rs'),source('ch3','os/src/config.rs')]);
 table(s,[['应用','运行区域起点'],['A','0x80400000'],['B','0x80420000'],['C','0x80440000']],74,184,1132,350,[430,702],{size:32});
 caption(s,'单核：多个程序驻留，一个任务正在执行');
}
{
 const s=slide('切走以后，怎样接着跑',3,'暂停需要把现场保存下来，恢复时再装回。要区分两份上下文。TrapContext 保存 U 态被打断时的通用寄存器、sstatus 与 sepc。TaskContext 保存内核中 __switch 调用所需的 ra、sp、s0 到 s11，遵循函数调用约定。__switch 保存当前任务再恢复下一个任务；后续通过恢复 TrapContext 回到该应用的用户态位置。切换不是每次都从 main 重启。',[source('ch3','os/src/task/context.rs'),source('ch3','os/src/task/switch.S'),source('ch3','os/src/trap/context.rs')]);
 table(s,[['上下文','保存的内容'],['TrapContext','应用寄存器、状态、sepc'],['TaskContext','ra、sp、s0–s11']],74,205,1132,264,[420,712],{size:32});
 caption(s,'保存当前位置，下次从这里继续',568,C.teal);
}
{
 const s=slide('协作式：应用主动让出 CPU',2,'先从容易理解的协作式方案开始。应用发起 yield 系统调用，内核把当前任务从 Running 标为 Ready，再选择另一个 Ready 任务并切换。页上的函数来自当前 ch3 内核，实际应用通过用户库的系统调用封装进入这里。主动让出依赖应用配合，因此适合引出下一页的问题：如果应用永远不发起 yield，会怎样。',[source('ch3','os/src/syscall/process.rs'),source('ch3','os/src/task/mod.rs')]);
 code(s,'pub fn sys_yield() -> isize {\n    suspend_current_and_run_next();\n    0\n}',82,196,1100,33);
 caption(s,'应用愿意让出，调度器才有机会切换',568,C.teal);
}
{
 const s=slide('如果应用一直不让出',1,'停顿十秒，让同学回答。只有协作式机制时，一个永不 yield 的循环可以一直占着 CPU。内核需要一种不依赖该应用主动请求的进入机会，也就是时钟中断。这里不要把正常业务循环等同于非法指令：它可以完全合法，但不合作。',[source('ch3','os/src/trap/mod.rs')],C.peach);
 code(s,'loop {}',82,206,1090,76);
 text(s,'谁来拿回 CPU？',82,412,1100,94,53,C.ink,{bold:true});
}
{
 const s=slide('抢占式：时钟到点，内核接管',3,'设置下一次时钟事件并允许 S 态定时器中断。应用运行中，时钟事件使处理器进入 Trap 入口，保存应用现场，内核重新设置下一次触发，然后调度其他 Ready 任务。ch3 的 TICKS_PER_SEC=100，按配置频率计算约 10 毫秒，实际时间依赖 CLOCK_FREQ 与平台时钟一致。强调两个时间尺度：广告每五分钟更换一次内容属于业务策略，CPU 调度通常按毫秒级交替执行。仅写一个每五分钟更新画面的循环，本身不能说明已经有多任务内核。',[source('ch3','os/src/timer.rs'),source('ch3','os/src/trap/mod.rs')]);
 code(s,'set_next_trigger();\nsuspend_current_and_run_next();',82,178,1110,34);
 table(s,[['广告播放周期','CPU 时间片'],['5 分钟','毫秒级']],74,382,1132,170,[566,566],{size:35,center:true});
}
{
 const s=slide('轮转：挑选下一个 Ready 任务',3,'沿任务列表向后查找，走到末尾再回到开头，挑选第一个 Ready 的任务。当前任务被暂停后重新变为 Ready，下一个任务进入 Running；Exited 的任务跳过。页面假设 A、B、C 一直可运行，用六个时间片说明 A、B、C、A、B、C 的轮转。每一格是一个 CPU 时间片，不是广告业务的五分钟。轮转分配运行机会，不承诺每个任务获得相同业务进度。',[source('ch3','os/src/task/mod.rs'),source('ch3','os/src/task/task.rs')]);
 table(s,[['1','2','3','4','5','6'],['A','B','C','A','B','C']],74,211,1132,182,[188,188,189,189,189,189],{size:42,center:true,fills:[[],[C.mint,C.peach,'#E5E9F0',C.mint,C.peach,'#E5E9F0']]});
 text(s,'Ready 等待    Running 执行    Exited 跳过',80,467,1110,75,32,C.body);
 caption(s,'示例：三个任务都持续可运行');
}

// 24–26: 10 minutes, code map, recap and discussion.
{
 const s=slide('课后沿这几处源码继续读',3,'用三分钟收束到实际仓库。裸机分支只需看四个文件，ch1 重点看最小执行环境，ch2 从 run_next_app 和 trap_handler 接起来，ch3 从时钟中断到 suspend_current_and_run_next，再到 __switch。当前课程仓库的应用测试工程由课程流程提供，不假设 user 目录已经存在。课堂不在此临时完整搭建 ch2/ch3 的测试环境。请同学课后结合对应章节指南跑实验，跟踪一次控制流。',[repository,source('bare','src/main.rs'),source('ch2','os/src/batch.rs'),source('ch3','os/src/task/mod.rs')]);
 table(s,[['分支','关注位置'],['bare-metal-hello','entry.asm、linker.ld、main.rs、sbi.rs'],['ch1','基本执行环境'],['ch2','batch.rs、trap/'],['ch3','task/、timer.rs、trap/']],74,171,1132,385,[340,792],{size:28});
 caption(s,'沿一次运行追踪控制权，比一次读完所有代码更清楚');
}
{
 const s=slide('每次改造，都回答一个问题',2,'让学生复述新增能力与需求的对应关系。第一章解决程序如何在无 OS 的环境运行。第二章管理一批应用，把完成或异常后的控制权交回内核，再选择下一项。第三章保存现场和分配运行时间，使未结束的程序也能交替推进。把故事中的节约换卡成本与系统里的控制权管理联系起来，避免只记住三个章节名。',[guide.bare,guide.batch,guide.time]);
 table(s,[['阶段','核心问题','对应机制'],['ch1','程序怎样跑起来','入口、栈、固件服务'],['ch2','怎样自动运行下一项','加载、系统调用、Trap'],['ch3','怎样轮流且接着执行','上下文、调度、时钟']],74,184,1132,350,[220,440,472],{size:29});
}
{
 const s=slide('回到这块广告屏',5,'最后五分钟提问。先让同学回答页面上的三个问题。参考答案：裸机时由我们自己和 RustSBI 提供基本执行环境；引入内核后由 S 态内核管理 U 态应用。拿回 CPU 的方式包括应用主动系统调用、异常以及允许的时钟中断。能继续执行是因为上下文和内存状态得到保存。可追加提问：把广告每五分钟轮换一次是否自动等于多任务？答案是否，需要有可独立保存和恢复的多个任务与调度机制。若没有提问，可请一位同学复述从 ecall 到返回用户态的路径。',[guide.bare,guide.trap,guide.time],C.mint);
 text(s,'谁提供执行环境？',78,192,1120,79,48,C.ink,{bold:true});
 text(s,'谁能拿回 CPU？',78,326,1120,79,48,C.ink,{bold:true});
 text(s,'切回来，为什么还能继续？',78,460,1120,90,48,C.ink,{bold:true});
}

if(records.length!==26) throw new Error(`Unexpected slide count: ${records.length}`);
if(records.reduce((sum,r)=>sum+r.minutes,0)!==60) throw new Error('Timing must total 60 minutes');
await fs.writeFile(path.join(root,'lecture/lesson-plan.json'),JSON.stringify({title:'一块广告屏里的操作系统',durationMinutes:60,slides:records},null,2)+'\n');
const candidate=path.join(build,'candidate-ready.pptx');
await (await PresentationFile.exportPptx(p)).save(candidate);
console.log(`Draft written: ${records.length} slides, 60 minutes`);
const finalPath=path.join(out,'OpenCamp2026-专业阶段第一课.pptx');
const result=await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath,pythonExecutable:path.join(runtime,'python/bin/python3'),integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit',...tableSlides.flatMap(n=>['--require-native-table-slide',String(n)])],requiredNativeTableOwnerSlides:tableSlides,fontPolicy:{basis:'design',families:[FONT,MONO]},verifyArtifactToolImport:true,receiptPath:path.join(build,'validation.json')});
console.log(`Finalized: ${result.finalPath}`);
const finalDeck=await PresentationFile.importPptx(await FileBlob.load(finalPath));
for(let i=0;i<finalDeck.slides.items.length;i++){
  const png=await finalDeck.export({slide:finalDeck.slides.items[i],format:'png',scale:1});
  await fs.writeFile(path.join(build,`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await png.arrayBuffer()));
  console.log(`Rendered ${i+1}/${records.length}`);
}
const montage=await finalDeck.export({format:'webp',montage:true,scale:0.25});
await fs.writeFile(path.join(build,'overview.webp'),new Uint8Array(await montage.arrayBuffer()));
console.log('All slide previews rendered.');
