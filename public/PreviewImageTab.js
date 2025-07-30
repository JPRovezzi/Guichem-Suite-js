// PreviewImageTab.js
import { defineComponent } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js';

export default defineComponent({
  props: ['tab'],
  template: `
    <div>
      <div class="font-bold font-1-1em margin-bottom-12">{{ tab.title }}</div>
      <div class="display-flex align-center justify-center max-width-100 overflow-auto">
        <img :src="tab.content" class="max-width-100 max-height-60vh object-fit-contain box-shadow-img border-radius-8" />
      </div>
    </div>
  `
});
