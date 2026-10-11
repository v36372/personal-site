+++
title = "Root access is not a working phone"
date = 2026-10-11
slug = "root-access-is-not-a-working-phone"
description = "I used CYBER-FROST on an ASUS GX10 to investigate a locked iPhone. Low-level access did not produce a fully recovered phone."
tags = ["AI", "Hardware"]
draft = false
+++

## Objective

I'd just [acquired an ASUS GX10](https://x.com/v36372/status/2108218774642139543)
and wanted to try a local model on a practical problem. My sister's iPhone 11
had an owner lock after her Apple account was hacked. The goal was to get it
working again with open-source tools.

## Setup

The GX10 ran
[CYBER-FROST](https://huggingface.co/vcruz305/CYBER-FROST-3.8-EXL3-SAGE-3.87bpw)
through [Pi](https://github.com/earendil-works/pi). I chose it to explore the
hacking route with a model modified to reduce refusals. A Mac mini handled the
builds and the phone's USB connection.

I also used a B4 Pico phone-repair board built around Raspberry Pi's RP2350A
microcontroller. It has USB-C and a Lightning plug. The board handles the
low-level USB interaction needed for the boot-ROM exploit, which ordinary Mac
USB tooling cannot perform. It is not a stock Raspberry Pi Pico 2.

![An iPhone displaying boot logs beside a Mac mini and a B4 Pico phone-repair board on a wooden desk.](/images/iphone-pi-session.jpg)

*The Mac mini, iPhone, and B4 Pico. The GX10 is not pictured.*

## Journey

The agent checked the phone's firmware and activation state, researched
community tools, and adapted their builds for the Mac. We moved from firmware
preparation to board-assisted boot tests, then worked on an SSH-enabled system
and a modified setup flow.

## Difficulties

Board compatibility and device recovery took much of the work. Guides for
related RP2350 boards did not settle compatibility with the B4's wiring and
firmware. A Mac USB listing also could not show the whole setup while the
phone was connected to the board.

One file-deletion experiment was followed by a boot failure. A restore got the
phone booting again on newer firmware, which changed the conditions for later
tests.

## Results

We got SSH access and booted a modified system that passed the local setup
flow. The phone remained tethered. Reboots needed the board and Mac. We
disabled cellular services while investigating instability, and a short
uptime check did not establish long-term stability.

That was device access, not evidence that Apple had removed the account
association. The result was a research device, not a fully recovered everyday
phone.
