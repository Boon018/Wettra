import { cacheKey } from './config.js';
export function storageAndNetwork(location) {
  const fm = FileManager.local();
  // Keep the historical folder so existing Scriptable cache survives the rename.
  const directory = fm.joinPath(fm.libraryDirectory(), 'Alpenwetter');
  if (!fm.fileExists(directory)) fm.createDirectory(directory, true);
  const file = fm.joinPath(directory, cacheKey(location) + '.json');
  return {
    read: () => {
      for (const candidate of [file, file + '.backup']) {
        try { if (fm.fileExists(candidate)) return JSON.parse(fm.readString(candidate)); } catch {}
      }
      return null;
    },
    write: data => {
      // Write the replacement before touching the last known-good file.
      const tmp = file + '.tmp';
      fm.writeString(tmp, JSON.stringify(data));
      JSON.parse(fm.readString(tmp));
      const backup = file + '.backup';
      if (fm.fileExists(backup)) fm.remove(backup);
      if (fm.fileExists(file)) fm.move(file, backup);
      try { fm.move(tmp, file); }
      catch (error) { if (fm.fileExists(backup)) fm.move(backup, file); throw error; }
    },
    request: async params => {
      const query = Object.entries(params).map(([k,v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');
      const req = new Request('https://api.open-meteo.com/v1/forecast?' + query);
      req.timeoutInterval = 12;
      const data = await req.loadJSON();
      if (req.response?.statusCode !== 200 || data?.error) throw Error('Wetterdienst nicht verfügbar');
      return data;
    }
  };
}
