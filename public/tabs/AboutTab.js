// AboutTab.js
const AboutTab = Vue.defineComponent({
  props: ['tab'],
  template: `<div>About this app: version 1.0.0</div>`
});
AboutTab.noConfirmClose = true;
export default AboutTab;
