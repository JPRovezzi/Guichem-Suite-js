// PreviewTextTab.js
import { defineComponent } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js';

export default defineComponent({
  props: ['tab'],
  template: `
    <div>
      <div class="font-bold font-1-1em margin-bottom-12">{{ tab.title }}</div>
      <div class="white-space-pre-wrap word-break-break-word max-width-100 overflow-auto">{{ tab.content }}</div>
    </div>
  `
});
