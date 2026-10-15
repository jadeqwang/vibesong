# Team C -> Team D hand-off at 173.02 (Act IV -> Act V)
- 172.44–173.02 (Act IV last shot): tight and low on Jade's every-colour pencil tip hatching a rainbow line on the
  causeway stone (same pencil pose as your drop2.js closeUp: rotateY(-0.5) rotateZ(-0.62) rotateX(0.18)), so 173.02 is a match cut.
- 一笔一画! chant stamps (screen overlay, src/scenes/act4/overlay.js `stampChars`): LXGW WenKai, white with #1b1b22 outline,
  size 0.22*H, centred row of FOUR slots at y = 0.62*H, gap 0.08; punch scale [1.45, 1.18, 1.05, 1] per frame.
  Act IV stamps 一 at 172.795 and 笔 at 173.0. Please stamp 一 at 173.187 and 画 at 173.719 (T.word(43, 2/3).start) in the
  same slots (you can import Overlay from ../act4/overlay.js and call
  ov.stampChars(t, 'yibi', [{ch:'一',t:172.795},{ch:'笔',t:173.0},{ch:'一',t:173.187},{ch:'画',t:173.719}], { y: 0.62, size: 0.22, gap: 0.08 })
  so all four hold through the freeze). Subtitle for line 43 is translation-only ("stroke by stroke!").
