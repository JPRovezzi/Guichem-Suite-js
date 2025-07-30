// PreviewUnsupportedTab.js
import { defineComponent } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js';

const PreviewUnsupportedTab = defineComponent({
  props: ['tab'],
  template: `
    <div>
      <div class="font-bold font-1-1em margin-bottom-12">{{ tab.title }}</div>
      <div class="color-e74c3c font-1-1em padding-32-0 white-space-pre-line">{{ tab.content }}</div>
    </div>
  `
});
PreviewUnsupportedTab.noConfirmClose = true;
export default PreviewUnsupportedTab;
