// NewProjectTab.js

export default {
  name: 'NewProjectTab',
  noConfirmClose: true,
  data() {
    return {
      tools: [],
      loading: true,
      error: '',
      selectedTool: null,
      showHelp: null // track help popup per tool
    };
  },
  mounted() {
    console.log('NewProjectTab mounted');
    this.loadTools();
  },
  methods: {
    async loadTools() {
      // Try to discover all tool folders by fetching a manifest, or fallback to hardcoded list
      // For now, try to fetch /addons/apps/default/tool.json and log the result
      const toolFolders = ['default'];
      const tools = [];
      for (const folder of toolFolders) {
        const url = `/addons/apps/${folder}/tool.json`;
        console.log('Fetching tool:', url);
        try {
          const resp = await fetch(url);
          if (!resp.ok) {
            console.warn('Tool fetch failed:', url, resp.status);
            continue;
          }
          const tool = await resp.json();
          tool.folder = folder;
          tools.push(tool);
          console.log('Loaded tool:', tool);
        } catch (e) {
          console.error('Error fetching tool:', url, e);
        }
      }
      this.tools = tools;
      this.loading = false;
      if (!tools.length) this.error = 'No tools found.';
    },
    selectTool(tool) {
      this.selectedTool = tool;
    },
    startTool() {
      if (!this.selectedTool) return;
      this.$emit('tab-event', { type: 'startTool', tool: this.selectedTool }, this.$parent.tab.id);
    },
    cancel() {
      // Use the parent's tab.id, which is always present in this app's structure
      let tabId = this.$parent && this.$parent.tab && this.$parent.tab.id;
      this.$emit('tab-event', { type: 'cancel' }, tabId);
    },
    toggleHelp(idx) {
      this.showHelp = this.showHelp === idx ? null : idx;
    }
  },
  template: `
    <div class="new-project-tab">
      <h2>Start a New Project</h2>
      <div v-if="loading">Loading tools...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else>
        <div v-if="!tools.length">No tools found.</div>
        <ul v-else class="tool-list">
          <li v-for="(tool, idx) in tools" :key="tool.folder" :class="{selected: selectedTool && selectedTool.folder === tool.folder}" @click="selectTool(tool)" style="display: flex; align-items: center; cursor: pointer;">
            <input type="radio"
                   name="tool-select"
                   :checked="selectedTool && selectedTool.folder === tool.folder"
                   @change="selectTool(tool)"
                   style="margin-right: 10px; accent-color: #3498db;" />
            <span style="margin-right: 12px;">{{ tool.name || tool.folder }}</span>
            <button class="help-btn" @click.stop="toggleHelp(idx)" style="background: none; border: none; cursor: pointer; padding: 0; margin-left: 4px; font-size: 1.2em; color: #3498db; vertical-align: middle;">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
                <circle cx="10" cy="10" r="9" stroke="#3498db" stroke-width="2" fill="#f8fbff"/>
                <text x="10" y="15" text-anchor="middle" font-size="13" fill="#3498db" font-family="Arial, sans-serif" font-weight="bold">?</text>
              </svg>
            </button>
            <div v-if="showHelp === idx" class="help-popup">{{ tool.description || 'No description.' }}</div>
          </li>
        </ul>
        <div class="actions">
          <button :disabled="!selectedTool" @click="startTool">Start</button>
          <button @click="cancel">Cancel</button>
        </div>
      </div>
    </div>
  `
}
