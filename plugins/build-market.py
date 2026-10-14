"""Optional maintainer tool. Plugin users need only the packaged JSON and JavaScript."""
from pathlib import Path
import datetime
import hashlib
import json
import re
import zipfile

root = Path(__file__).resolve().parent
packages = root / "packages"
packages.mkdir(exist_ok=True)
entries = []
for folder in sorted((root / "official").iterdir()):
    source = folder / "plugin.json"
    if not source.exists():
        continue
    manifest = json.loads(source.read_text(encoding="utf-8-sig"))
    pid, version = manifest["id"], manifest["pluginVersion"]
    if pid != folder.name or not re.fullmatch(r"[a-z][a-z0-9-]{1,59}", pid) or not re.fullmatch(r"\d+\.\d+\.\d+", version):
        raise ValueError("Invalid plugin identity/version")
    names = ["plugin.json", manifest["script"], "README.md"]
    if manifest.get("loginScript"):
        names.append(manifest["loginScript"])
    if len(set(names)) != len(names) or any(Path(name).name != name for name in names):
        raise ValueError("Invalid package filenames")
    source_bytes = {name: (folder / name).read_bytes() for name in names}
    frozen = folder / version
    frozen.mkdir(exist_ok=True)
    for name, data in source_bytes.items():
        saved = frozen / name
        if saved.exists() and saved.read_bytes() != data:
            raise ValueError(f"{pid} {version} is frozen; increase pluginVersion before changing source")
        saved.write_bytes(data)
    package = packages / f"{pid}-{version}.zip"
    if package.exists():
        with zipfile.ZipFile(package) as archive:
            if set(archive.namelist()) != set(names) or any(archive.read(name) != data for name, data in source_bytes.items()):
                raise ValueError(f"{pid} {version} package changed; use a new version")
    else:
        with zipfile.ZipFile(package, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for name, data in source_bytes.items():
                info = zipfile.ZipInfo(name, (1980, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                archive.writestr(info, data)
    data = package.read_bytes()
    entries.append({"id": pid, "name": manifest["name"], "version": version,
                    "hostApiVersion": manifest.get("hostApiVersion", 2),
                    "description": "网页任务读取与完成状态同步。", "packagePath": "plugins/packages/" + package.name,
                    "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)})
catalog = {"schemaVersion": 1, "channel": "beta", "generatedAt": datetime.date.today().isoformat(), "plugins": entries}
(root / "marketplace.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("Built", len(entries), "plugin entries; existing versions preserved")
