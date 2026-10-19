// SINGLE SOURCE for subtitle copy (bible: "Translations" + "Bilingual subtitles (both directions)").
// Rule: the sung language goes on top (karaoke-lit from word times), the translation smaller below
// (fp10, second colour) in ONE subtitle slot. (v4, 2026-10-18) A line is EITHER in the world OR in the subtitle bar,
// never both: when the sung words are built into the world (hero type, the *because* bridge, the floor lyric,
// characters-as-platforms, the slammed 一笔一画 / 出发 characters) set inWorld: true and NO subtitle is shown
// (core/ui.js subtitleFor returns null). No subtitles for ad-libs or the Fixtures!/Functions! chants.
// "fixtures"/"functions" stay in English inside the Chinese subtitles, as in the song's own Chinese.
// Keyed by lyric line id (analysis/lyrics_timed.json). Lines not listed get no subtitle.
// Timing (v4B type M4, core/ui.js subtitleFor): a bar shows from its line's FIRST SUNG WORD - lead (0.12 s), not from the
// line's start (line 41 starts at 154.26 for act4's gang switch; "And" is sung at 155.90), and a line whose display a clear
// frame interrupts does not come back after it. Line 33 (Fixtures 打底 functions 上色) lies wholly inside the paint-flood
// clear frame (119.0-123.354), so it is never subtitled: zero UI there by design (docs/v4_passB_brief.md).

/** LOCKED 2026-10-14 (Jade): Chinese subtitle for the intro chant. */
export const CHANT_ZH = '画出来，跑起来，上线！';
/** per-word split of CHANT_ZH, aligned to PAINT IT / RUN IT / SHIP IT */
export const CHANT_ZH_PARTS = ['画出来，', '跑起来，', '上线！'];

export const SUBS = {
  2: { sung: 'en', top: 'Paint it, run it, ship it!', bot: CHANT_ZH, inWorld: true },
  4: { sung: 'zh', top: '一笔 一画', bot: 'stroke by stroke', inWorld: true }, // the title characters redraw on screen
  5: { sung: 'en', top: 'Everything I love about life just blossoms', bot: '我爱的一切，都在绽放', inWorld: true },
  6: { sung: 'en', top: 'because', bot: '因为', inWorld: true },
  7: { sung: 'en', top: 'my imagination is linked to my everyday life', bot: '我的想象，连着我的日常' },
  8: { sung: 'zh', top: '每一天 都是色彩', bot: 'every day is full of color' },
  9: { sung: 'zh', top: '真世界 就画出来', bot: 'the real world, I just draw it out' },
  10: { sung: 'zh', top: '说出来 它就存在', bot: 'say it out loud, and it exists', inWorld: true },
  11: { sung: 'zh', top: '彩色笔 画出未来', bot: 'colored pencils draw the future' },
  12: { sung: 'en', top: 'I think about stuff I read', bot: '我想着读过的东西' },
  13: { sung: 'en', top: 'I just ask myself what it is that I need?', bot: '问自己：我需要什么？' },
  14: { sung: 'en', top: "That's it, the fixtures and the functions", bot: '就是这样，fixtures 和 functions' },
  16: { sung: 'en', top: 'And everything goes from there', bot: '一切从这里出发' },
  17: { sung: 'zh', top: '一切从这里出发！', bot: 'everything starts from here!', inWorld: true },   // the characters draw on screen (act2 chorus)
  18: { sung: 'zh', top: '一笔一画！', bot: 'stroke by stroke!', inWorld: true },   // the four characters slam (the turn)
  24: { sung: 'en', top: 'Everything I love about life just blossoms', bot: '我爱的一切，都在绽放', inWorld: true },   // (v4B type) big 绽 + gloss (type.zhan)
  25: { sung: 'en', top: 'because', bot: '因为', inWorld: true },
  26: { sung: 'en', top: 'my imagination is linked to my everyday life', bot: '我的想象，连着我的日常' },
  27: { sung: 'zh', top: '世界 是我的舞台', bot: 'the world is my stage', inWorld: true },   // (v4B type) big 舞台 + gloss (type.wutai)
  28: { sung: 'zh', top: '不用背语法 我只说出想法', bot: "no need to memorize syntax, I just say what I'm thinking" },
  30: { sung: 'zh', top: '一句话 屏幕上就开出花', bot: 'one sentence and flowers bloom on the screen' },
  32: { sung: 'zh', top: 'Bug 也不怕 就当草稿再画', bot: 'not scared of bugs, call it a draft and draw again' },
  33: { sung: 'zh', top: 'Fixtures 打底 functions 上色', bot: 'fixtures lay the base, functions add the color' },
  34: { sung: 'zh', top: '是一幅画 也是一段代码', bot: "it's a painting, and it's also code", inWorld: true },   // (v4B type) the split couplet (type.couplet)
  35: { sung: 'zh', top: '一笔一画 都是我的回答', bot: 'every stroke is my answer', inWorld: true },   // (v4B type) big 答 + gloss on the paper card (type.da)
  36: { sung: 'zh', top: '是一幅画 也是一段代码', bot: "it's a painting, and it's also code" },
  37: { sung: 'zh', top: '一笔一画 都是我的回答', bot: 'every stroke is my answer' },
  38: { sung: 'en', top: 'I think about stuff I read', bot: '我想着读过的东西' },
  39: { sung: 'en', top: 'I just ask myself what it is that I need?', bot: '问自己：我需要什么？' },
  40: { sung: 'en', top: "That's it, the fixtures and the functions", bot: '就是这样，fixtures 和 functions' },
  41: { sung: 'en', top: 'And everything goes from there', bot: '一切从这里出发' },
  42: { sung: 'zh', top: '一切从这里出发！', bot: 'everything starts from here!' },
  43: { sung: 'zh', top: '一笔一画！', bot: 'stroke by stroke!', inWorld: true },   // the pencil draws them (montage / drop 2)
  48: { sung: 'en', top: 'Everything I love about life just blossoms', bot: '我爱的一切，都在绽放' },
  49: { sung: 'en', top: "(that's it.)", bot: '（就这样。）' },
  50: { sung: 'zh', top: '一笔一画！', bot: 'stroke by stroke!', inWorld: true },   // the title draws on the sketchbook page
};
