+++
title = "Root access is not a working phone"
date = 2026-10-11
slug = "root-access-is-not-a-working-phone"
description = "A Qwen3.8-Flash-Next derivative on an ASUS GX10 helped boot a locked iPhone into modified iOS 27.0.1. Full recovery remained unresolved."
tags = ["AI", "Hardware"]
draft = false
+++

I'd just [acquired an ASUS GX10](https://x.com/v36372/status/2108218774642139543)
and wanted to try a local model on a practical problem. My sister's iPhone 11
had an owner lock after her Apple account was hacked. The goal was to see
whether open-source tools could get it working again.

I wanted to test an abliterated model, one altered to suppress refusal
behavior. I chose
[CYBER-FROST-3.8](https://huggingface.co/vcruz305/CYBER-FROST-3.8-EXL3-SAGE-3.87bpw),
Blackfrost-AI's security-fine-tuned derivative of Qwen3.8-Flash-Next, and ran it
through [Pi](https://github.com/earendil-works/pi). Its model card describes a
proprietary behavioral modification aimed at reducing refusals, without
publishing the exact method. I used vcruz305's EXL3/SAGE quantized pack, at 3.87
bits per weight for the model body, to fit the weights on the GX10.

The GX10 handled model inference, while a Mac mini handled the builds and USB
communication with the phone. The agent could research projects and prepare
software on the Mac, but the device tests still depended on the physical
setup.

The investigation started with the phone's firmware and activation state. The
agent compared community projects, checked their support, and prepared
firmware components. These projects covered different parts of the process,
including early boot access, SSH environments, and modified system images.
Getting the software to build was useful, but we still had to test what each
component actually did on the phone.

The research led to usbliter8, a hardware-assisted boot-ROM exploit. That
required low-level USB communication that ordinary Mac USB tooling could not
perform. I used a B4 Pico phone-repair board built around Raspberry Pi's
RP2350A microcontroller. It has USB-C and a Lightning plug, and handles the
early USB stage before the Mac does the later software work. It is not a stock
Raspberry Pi Pico 2.

![An iPhone displaying boot logs beside a Mac mini and a B4 Pico phone-repair board on a wooden desk.](/images/iphone-pi-session.jpg)

*The Mac mini, iPhone, and B4 Pico. The GX10 is not pictured.*

Board compatibility needed its own checks. Guides for related RP2350 boards
did not establish compatibility with the B4's vendor firmware and wiring.
The connection also affected what the Mac could observe. Its USB inventory
could show the board without showing the phone attached to it, so a missing
device entry did not establish that the phone had stopped running.

We obtained SSH access and could inspect the phone's software.
That allowed on-device experiments, but it did not make every filesystem
operation reliable. Backup attempts returned permission errors during one
protected-file experiment. A later file deletion was followed by a boot
failure. A restore got the phone booting again on newer firmware, replacing
the original iOS 18.0 environment and changing the conditions for subsequent
builds and tests.

The investigation also ran long enough for Pi to condense older context. The
original records remained available, but later requests used shorter
summaries. Those summaries needed to keep the current firmware version and
hardware configuration, and distinguish a successful build from a confirmed
result on the device.

By the end, the iPhone was running modified iOS 27.0.1, build 24A446, using
[Liter8](https://github.com/Xplo8E/Liter8) after the usbliter8 stage. We got
through the local setup flow and obtained SSH access. It remained tethered.
Every reboot needed the board and Mac to repeat the boot process.

Root access lets us inspect files and change local software. Apple manages
the owner record and activation authorization on its servers. The account
association remained unresolved. Apple documents
[account-side removal](https://support.apple.com/en-us/108934).

There were limits to functionality too. We disabled cellular services while
investigating instability, so our final configuration did not establish
working calls or mobile data. Liter8's documentation also lists the Secure
Enclave, passcodes, and Apple services as not working. The final recorded
uptime was about eight minutes. Long-term stability and the cause of earlier
shutdowns remained unconfirmed.

The local agent helped with repository research and adapting the build
environment. We got low-level access and software running on the phone. Full
recovery for my sister remained unresolved. We finished with a tethered
research device.

Pi recorded about 195.7 million tokens across the session, mostly cached
context reused between requests. Using current
[Qwen3.8 token prices](https://docs.ninjachat.ai/api-reference/models/chat/qwen-3-8-flash-next),
I estimate that usage at about $3.78 with the same cache reuse, or $29.51 if
all input were billed uncached.

Next I want to experiment with
[PiDurableKit](https://github.com/finnvoor/PiDurableKit), a Swift interface to
pi-durable for Apple platforms. It persists conversations and agent execution
state so work can continue after an app restart. Interrupted tool calls are
replayed only when declared safe to repeat. I want to test agent state
recovery and controlled tool replay with the model still running on the GX10.
