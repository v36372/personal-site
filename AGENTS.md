# Personal website

- Working source: /home/exedev/codes/tinnguyen on the BB VM.
- Deployment VM: tinnguyen.exe.xyz, image ghcr.io/ryanlewis/exeslim:latest.
- This is a static site: edit public/, run make test, deploy with make deploy.
- The exe integration at https://exe.int.exe.xyz/exec provides owner-authenticated
  API access from this BB VM. Do not request or write API tokens into the repo.
- Only /srv/tinnguyen/current on nginx port 8000 is public. Do not serve the
  source root or expose admin/dev servers publicly.
- Do not invent personal biography, social links, projects, or contact details.
- exeslim is a deployment target without a development toolchain. Develop here.
