+++
title = "Root access is not a working phone"
date = 2026-10-11
slug = "root-access-is-not-a-working-phone"
description = "I used CYBER-FROST on an ASUS GX10 to investigate a locked iPhone. Low-level access did not produce a fully recovered phone."
tags = ["AI", "Hardware"]
draft = false
+++

I'd just acquired an ASUS GX10 and wanted to try a local model on a practical
problem. My sister's iPhone 11 had an owner lock after her Apple account was
hacked. I wanted to investigate whether open-source tools could get it working
again.

I ran CYBER-FROST, an abliterated model, through
[Pi](https://github.com/earendil-works/pi). Abliteration modifies a model to
reduce refusal behavior. I chose it to explore the hacking route, with the
agent researching tools and working through the software.

The GX10 ran the model. A Mac mini handled builds and the phone's USB
connection. The experiment combined repository research, firmware preparation,
and testing on the device.

![An iPhone displaying boot logs beside a Mac mini and a small repair board on a wooden desk.](/images/iphone-pi-session.jpg)

*My setup during the experiment. The GX10 running the model is not pictured.*

## What the experiment achieved

The agent identified the phone's software and activation state, investigated
community tooling, built firmware components, and obtained SSH access. We
eventually booted a modified system that got through the local setup flow.

That established useful low-level access, but the original recovery goal
remained unresolved. The system was tethered, so restarting required the board
and Mac. Cellular services were disabled in an attempt to address instability.
Long-term stability was not established.

The result was an experimental device rather than a recovered everyday phone.
That distinction matters when evaluating what the agent accomplished.

## Device access and account authorization are different

A root shell gives access to the device's software. It does not establish that
Apple has removed the account association or authorized activation.

Changing the local setup flow and removing a server-side owner record are
separate outcomes. This experiment demonstrated the former, not the latter.
Apple documents [account-side removal separately](https://support.apple.com/en-us/108934).

The same distinction applies to functionality. Booting a modified system does
not establish that its modem, security services, and ordinary apps work as they
did on the stock system. Those functions need their own tests.

## What I'd require for another experiment

### Verify the exact hardware

Compatibility depends on the board's wiring and firmware, not only its chip.
A model can find documentation for a related board without establishing that
those instructions apply to the hardware in use.

Host diagnostics also have limits. A phone absent from the Mac's USB inventory
may still be running while connected to another device. Tool output needs to
be interpreted against the current connection, rather than treated as a
complete view of the setup.

For another experiment, I'd keep the verified hardware configuration and
connection state in a short reference note.

### Test recovery before changing protected state

One file-deletion experiment was followed by a boot failure. We recovered by
restoring newer firmware, which changed the conditions for subsequent tests.

Recovery therefore needs to be part of the experiment design. A backup should
be verified, and the restore procedure should be tested before a destructive
change. Restoring a different firmware version may recover the device without
recovering the original test environment.

### Preserve confirmed facts across long sessions

Pi condensed older context during this session. The original records remained
available, but later model requests used summaries.

A useful summary needs the current firmware version, confirmed hardware
configuration, and recovery status. It should distinguish observations from
explanations that still need testing. I can't attribute a particular error to
compaction, but these facts need to remain available as the investigation
continues.

### Test the intended use, not only the boot process

Firmware verification, shell access, and a successful boot answer different
questions. None replaces a test of cellular service or sustained operation
away from the host computer.

After disabling cellular services, the session recorded a short uptime check.
That was insufficient to establish long-term stability or identify the cause
of earlier shutdowns. A configuration change and a verified fix are different
results.

For a recovery task, I'd define the required functions before modifying the
device and test them independently afterward.

## Where a local agent helped

The agent was useful for finding repositories, comparing tool support, and
adapting the build environment. It could connect information from different
projects and turn it into software we could test on the phone.

The abliterated model was willing to investigate the tooling route. That did
not establish compatibility or a working recovery procedure. Those remained
engineering checks.

I'd continue using the GX10 for this kind of research and build work, with
on-device changes limited to reviewed procedures and a verified recovery path.
For my sister's phone, full recovery remained unresolved at the end of the
experiment.
