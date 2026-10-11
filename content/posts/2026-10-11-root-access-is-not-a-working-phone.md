+++
title = "Root access is not a working phone"
date = 2026-10-11
slug = "root-access-is-not-a-working-phone"
description = "I used CYBER-FROST on an ASUS GX10 to investigate a locked iPhone. Low-level access did not produce a fully recovered phone."
tags = ["AI", "Hardware"]
draft = false
+++

I'd just [acquired an ASUS GX10](https://x.com/v36372/status/2108218774642139543)
and wanted to try a local model on a practical problem. My sister's iPhone 11
had an owner lock after her Apple account was hacked. The goal was to see
whether open-source tools could get it working again.

I ran
[CYBER-FROST](https://huggingface.co/vcruz305/CYBER-FROST-3.8-EXL3-SAGE-3.87bpw)
through [Pi](https://github.com/earendil-works/pi). I chose it to explore the
hacking route with a model modified to reduce refusals. The GX10 handled model
inference, while a Mac mini handled the builds and USB communication with the
phone. The agent could research projects and prepare software on the Mac, but
the device tests still depended on the physical setup.

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
The connection also affected what the Mac could observe. Its USB inventory could show the
board without showing the phone attached to it, so a missing device entry did
not establish that the phone had stopped running.

We obtained SSH access and could inspect the phone's software.
That allowed on-device experiments, but it did not make every filesystem
operation reliable. Backup attempts returned permission errors during one
protected-file experiment. A later file deletion was followed by a boot
failure. A restore got the phone booting again on newer firmware, which
changed the conditions for subsequent builds and tests.

The investigation also ran long enough for Pi to condense older context. The
original records remained available, but later requests used shorter
summaries. Those summaries needed to keep the current firmware version and
hardware configuration, and distinguish a successful build from a confirmed
result on the device.

We booted a modified system that got through the local setup flow.
It remained tethered. Restarting required the board and Mac, rather than an
ordinary reboot into an independently usable phone. That dependency was part
of the result, even though the system could boot and accept an SSH connection.

Getting past setup did not establish that Apple had removed the account
association. Root access lets us inspect files and change local software.
Apple's server-side owner record and activation authorization are separate.
Apple documents [account-side removal separately](https://support.apple.com/en-us/108934).
The experiment demonstrated a modified local setup flow, not removal of that
record.

There were limits to functionality too. We disabled cellular services while
investigating instability. A short uptime check afterward did not establish
long-term stability or prove the cause of earlier shutdowns. It also could not
show that the phone would work as an everyday device away from the host
computer.

The local agent helped with repository research and adapting the build
environment. We got low-level access and software running on the phone. For my
sister, though, full recovery remained unresolved. The result was a tethered
research device, not a recovered everyday phone.
