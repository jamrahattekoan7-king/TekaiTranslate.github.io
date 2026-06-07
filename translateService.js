// translateService.js - basic translation pipeline using loaded JSONs and fallback dictionaries
(function(){
  const runtimeLexicon = new Map(); // store derived/learned entries at runtime

  function normalizeText(text){
    return (text||"").trim();
  }

  function normalizeLookupKey(text){
    const cleaned = String(text || "").toLowerCase().trim()
      .replace(/[“”‘’"'().,;:?¡!¿\[\]{}]+/g, '')
      .normalize('NFC');
    return cleaned.replace(/\s+/g, ' ').trim();
  }

  function simpleTokenize(text){
    return normalizeText(text).split(/\s+/).filter(Boolean);
  }

  function joinTokens(tokens){
    return tokens.join(' ');
  }

  async function deriveUnknown(word, source, target, data, maps){
    const key = normalizeLookupKey(word);
    if (!key) return word;
    if (runtimeLexicon.has(key)) return runtimeLexicon.get(key);

    const suffixes = ['-je','je','-roz','roz','-oroz','oroz','-rva','rva','-arva','arva','-im','im','-in','in','-an','an','-ah','ah','-aya','aya','-kan','kan','-akkan','akkan','-kkan','kkan'];
    const candidates = [key];
    suffixes.forEach(suf => {
      if (key.endsWith(suf)) candidates.push(key.slice(0, -suf.length));
    });

    if (maps){
      const { enToTk, tkToEn } = maps;
      for (const c of candidates){
        if (source === 'tk' && target === 'en' && tkToEn.has(c)){
          runtimeLexicon.set(key, tkToEn.get(c));
          return tkToEn.get(c);
        }
        if (source === 'en' && target === 'tk' && enToTk.has(c)){
          runtimeLexicon.set(key, enToTk.get(c));
          return enToTk.get(c);
        }
      }
    }

    if (data && Array.isArray(data.pairs)){
      for (const p of data.pairs){
        if (!p.term || !p.gloss) continue;
        const termKey = normalizeLookupKey(p.term);
        const glossKey = normalizeLookupKey(p.gloss);
        if (source === 'tk' && target === 'en' && termKey.includes(key)){
          runtimeLexicon.set(key, p.gloss);
          return p.gloss;
        }
        if (source === 'en' && target === 'tk' && glossKey.includes(key)){
          runtimeLexicon.set(key, p.term);
          return p.term;
        }
      }
    }

    runtimeLexicon.set(key, word);
    return word;
  }

  function buildVocabMaps(data){
    const enToTk = new Map();
    const tkToEn = new Map();

    function isTekoanToken(text){
      if (!text) return false;
      const special = /[’‘'`‘“”öüÖÜâêîôûáéíóúāēīōūãẽĩõũ]/i;
      if (special.test(text)) return true;
      const normalized = text.toLowerCase();
      const tokiPhrases = ['g’','sj','zj','cj','mj','kj','ha-','ka-','ta-','ra-','ya-','ö','ü'];
      if (tokiPhrases.some(w => normalized.includes(w))) return true;
      if (/-/.test(text) && /[A-Za-z]/.test(text)) return true;
      return false;
    }

    function isEnglishToken(text){
      if (!text) return false;
      const normalized = text.toLowerCase();
      const englishClues = [' hello', ' hi', ' thank', ' yes', ' no', ' please', ' welcome', ' good', 'water', 'food', 'family', 'friend', 'the ', ' and ', ' of ', ' to ', ' in ', ' is ', ' you '];
      if (englishClues.some(clue => normalized.includes(clue))) return true;
      return false;
    }

    function maybeAddPair(term, gloss, sourceFile){
      const left = term.toString().trim();
      const right = gloss.toString().trim();
      if (!left || !right) return;
      const keyLeft = normalizeLookupKey(left);
      const keyRight = normalizeLookupKey(right);
      const fileHint = typeof sourceFile === 'string' ? sourceFile.toLowerCase() : '';

      function addAsTekoanLeft(){
        tkToEn.set(keyLeft, right);
        enToTk.set(keyRight, left);
      }
      function addAsEnglishLeft(){
        enToTk.set(keyLeft, right);
        tkToEn.set(keyRight, left);
      }

      const leftIsTekoan = isTekoanToken(left);
      const rightIsTekoan = isTekoanToken(right);
      const leftIsEnglish = isEnglishToken(left);
      const rightIsEnglish = isEnglishToken(right);

      if (leftIsTekoan && !rightIsTekoan){ addAsTekoanLeft(); return; }
      if (rightIsTekoan && !leftIsTekoan){ addAsEnglishLeft(); return; }
      if (leftIsEnglish && !rightIsEnglish){ addAsEnglishLeft(); return; }
      if (rightIsEnglish && !leftIsEnglish){ addAsTekoanLeft(); return; }

      if (/\b(phrasebook|phrases)\b/i.test(fileHint)){
        addAsTekoanLeft();
        return;
      }

      if (/\bvocab\b/i.test(fileHint)){
        if (leftIsEnglish || !leftIsTekoan){
          addAsEnglishLeft();
          return;
        }
        addAsTekoanLeft();
        return;
      }

      if (/\bmuvan\b/i.test(fileHint)){
        addAsTekoanLeft();
        return;
      }

      if (!leftIsTekoan && !rightIsTekoan){
        enToTk.set(keyLeft, right);
        tkToEn.set(keyRight, left);
        return;
      }

      if (leftIsTekoan){ addAsTekoanLeft(); }
      else { addAsEnglishLeft(); }
    }

    const pairs = (data && Array.isArray(data.pairs)) ? data.pairs : [];
    pairs.forEach(p => {
      maybeAddPair(p.term || '', p.gloss || '', p.sourceFile || '');
    });

    const tryArrays = ['vocab1','phrasebook','eksam','info'];
    tryArrays.forEach(k => {
      const arr = data[k];
      if (!Array.isArray(arr)) return;
      arr.forEach(item => {
        const en = item.word || item.english || item.source || item.text;
        const tk = item.translation || item.tekoan || item.target || item.t;
        if (en && tk) {
          enToTk.set(normalizeLookupKey(String(en)), String(tk));
          tkToEn.set(normalizeLookupKey(String(tk)), String(en));
        }
      });
    });

    return { enToTk, tkToEn };
  }

  window.translateService = {
    async translate(text, source='en', target='tk'){
      text = normalizeText(text);
      if (!text) return '';
      const normalizedText = normalizeLookupKey(text);

      const globalDict = (window.dictionary && typeof window.dictionary === 'object') ? window.dictionary : null;
      if (source === 'en' && target === 'tk' && globalDict){
        const direct = globalDict[normalizedText] || globalDict[text.toLowerCase().trim()];
        if (direct){
          console.debug('translateService: direct dictionary hit', normalizedText, direct);
          return direct;
        }
      }
      const globalReverse = (window.reverseDictionary && typeof window.reverseDictionary === 'object') ? window.reverseDictionary : null;
      if (source === 'tk' && target === 'en' && globalReverse){
        const direct = globalReverse[normalizedText] || globalReverse[text.toLowerCase().trim()];
        if (direct){
          console.debug('translateService: direct reverse dictionary hit', normalizedText, direct);
          return direct;
        }
      }

      const data = await window.dataLoader.loadAll().catch((err) => {
        console.warn('translateService: dataLoader.loadAll failed', err);
        return {};
      });

      // Build vocab maps from loaded data
      const { enToTk, tkToEn } = buildVocabMaps(data);

      // fallback to global dictionary if available
      const globalEnToTk = (window.dictionary && typeof window.dictionary === 'object') ? new Map(Object.entries(window.dictionary).map(([k,v])=>[normalizeLookupKey(k), v])) : new Map();
      const globalTkToEn = (window.reverseDictionary && typeof window.reverseDictionary === 'object') ? new Map(Object.entries(window.reverseDictionary).map(([k,v])=>[normalizeLookupKey(k), v])) : new Map();

      // Full-phrase lookup first
      const normalizedText = normalizeLookupKey(text);
      if (source === 'en' && target === 'tk'){
        if (enToTk.has(normalizedText)) return enToTk.get(normalizedText);
        if (globalEnToTk.has(normalizedText)) return globalEnToTk.get(normalizedText);
      }
      if (source === 'tk' && target === 'en'){
        if (tkToEn.has(normalizedText)) return tkToEn.get(normalizedText);
        if (globalTkToEn.has(normalizedText)) return globalTkToEn.get(normalizedText);
      }

      const tokens = simpleTokenize(text);
      const translatedTokens = [];
      for (const tok of tokens){
        const key = normalizeLookupKey(tok);
        let mapped = null;

        if (source === 'en' && target === 'tk'){
          mapped = enToTk.get(key) || globalEnToTk.get(key) || runtimeLexicon.get(key);
          if (!mapped){
            // attempt derivation using grammar rules
            mapped = await deriveUnknown(tok, source, target, data, { enToTk, tkToEn });
          }
        } else if (source === 'tk' && target === 'en'){
          mapped = tkToEn.get(key) || globalTkToEn.get(key) || runtimeLexicon.get(key);
          if (!mapped){
            mapped = await deriveUnknown(tok, source, target, data, { enToTk, tkToEn });
          }
        } else {
          mapped = tok; // unsupported pair: passthrough
        }

        translatedTokens.push(mapped || tok);
      }

      return joinTokens(translatedTokens);
    },

    // allow runtime injection of mappings
    addRuntimeMapping(src, dst){
      if (!src) return;
      runtimeLexicon.set(String(src).toLowerCase(), dst);
    }
  };

})();
