// GenericTab.js
import { defineComponent } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js';

export default defineComponent({
  props: ['tab'],
  emits: ['save'],
  template: `<div><div>{{ tab.content }}</div></div>`
});
