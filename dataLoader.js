// dataLoader.js - loader that fetches PDF->JSON outputs and extracts term-definition pairs
(function(){
  const candidatePaths = [
    '',
    'Vocabulary_PyPDF2/',
    'Grammar_PyPDF2/',
    'Phrases_PyPDF2/',
    'Info_PyPDF2/',
    'Muvanese_PyPDF2/'
  ];

  const expectedFiles = [
    'tekoan_grammar_output.json',
    'tekoan_phrasebook_output.json',
    'tekoan_phrases_output.json',
    'tekoan_vocab_1_output.json',
    'tekoan_vocab_2_output.json',
    'tekoan_eksam_output.json',
    'tekoan_info_output.json',
    'tekoan_muvan_output.json'
  ];

  function normalizeLine(l){
    return (l || '').replace(/^[\u2022\s\-•]+/, '').trim();
  }

  function parsePageContentToPairs(pageContent){
    const pairs = [];
    if (!pageContent) return pairs;
    const lines = pageContent.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    for (let raw of lines){
      const line = normalizeLine(raw);
      // pattern: Term - Definition
      const dashMatch = line.match(/^(.+?)\s*[-–—]\s*(.+)$/);
      if (dashMatch){
        const left = dashMatch[1].trim();
        const right = dashMatch[2].trim();
        pairs.push({ term: left, gloss: right });
        continue;
      }

      // pattern: word  .  n. definition  OR  word  .  n. Definition
      // many lines use a dot then space then POS marker (n., v., etc.)
      const dotMatch = line.match(/^(.+?)\s*\.\s*(?:n|v|adj|adv|pl|pt|n\.|v\.|adj\.|a|v)\.?\s*(.+)$/i);
      if (dotMatch){
        const left = dotMatch[1].trim();
        const right = dotMatch[2].trim();
        pairs.push({ term: left, gloss: right });
        continue;
      }

      // fallback: short lines with two words separated by multiple spaces, attempt split
      const twoCol = line.split(/\s{2,}/).map(s=>s.trim()).filter(Boolean);
      if (twoCol.length === 2){
        pairs.push({ term: twoCol[0], gloss: twoCol[1] });
        continue;
      }

      // fallback: simple comma/colon/semicolon separated bilingual entries
      const separatorMatch = line.match(/^(.+?)\s*[,;:]\s*(.+)$/);
      if (separatorMatch){
        const left = separatorMatch[1].trim();
        const right = separatorMatch[2].trim();
        if (left.split(/\s+/).length <= 4 && right.split(/\s+/).length <= 6){
          pairs.push({ term: left, gloss: right });
          continue;
        }
      }
    }

    return pairs;
  }

  async function tryFetch(url){
    try {
      const res = await fetch(url);
      if (!res.ok){
        console.warn('dataLoader: fetch failed', url, res.status, res.statusText);
        return null;
      }
      const json = await res.json();
      return json;
    } catch (err){
      console.warn('dataLoader: fetch exception', url, err);
      return null;
    }
  }

  window.dataLoader = {
    loaded: false,
    raw: {},
    pairs: [],

    async loadAll(){
      if (this.loaded) return { raw: this.raw, pairs: this.pairs };

      const results = {};
      const found = [];

      for (const base of candidatePaths){
        for (const file of expectedFiles){
          const p = base + file;
          if (results[p]) continue;
          const json = await tryFetch(p);
          if (json){
            results[p] = json;
            found.push(p);
          }
        }
      }

      this.raw = results;

      // extract pairs from any objects that look like page arrays
      const pairs = [];
      for (const [path, val] of Object.entries(results)){
        if (Array.isArray(val)){
          val.forEach(page => {
            if (page && typeof page.content === 'string'){
              const p = parsePageContentToPairs(page.content);
              p.forEach(x=>pairs.push(Object.assign({ sourceFile: path }, x)));
            }
          });
        } else if (typeof val === 'object' && val !== null){
          // attempt to scan values for strings
          const combined = Object.values(val).filter(v=>typeof v==='string').join('\n');
          if (combined) {
            const p = parsePageContentToPairs(combined);
            p.forEach(x=>pairs.push(Object.assign({ sourceFile: path }, x)));
          }
        }
      }

      this.pairs = pairs;
      this.loaded = true;
      return { raw: this.raw, pairs: this.pairs, found };
    },

    async loadJSON(url){
      return await tryFetch(url);
    },

    validate(){
      const missing = expectedFiles.filter(f => {
        for (const base of candidatePaths){
          const p = base + f;
          if (this.raw && this.raw[p]) return false;
        }
        return true;
      });
      return { missing, countPairs: this.pairs.length };
    }
  };

})();
