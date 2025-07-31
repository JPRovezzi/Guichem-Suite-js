// NewProjectTab.js

export default {
  name: 'NewProjectTab',
  noConfirmClose: true,
  props: ['tab'],
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
      this.loading = true;
      this.error = '';
      let toolFolders = [];
      try {
        const resp = await fetch('http://localhost:3001/api/available-tools?_=' + Date.now());
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data.folders)) {
            toolFolders = data.folders;
          }
        }
      } catch (e) {
        console.warn('Could not load available tools from backend:', e);
      }
      const tools = [];
      for (const folder of toolFolders) {
        const url = `/addons/apps/${folder}/tool.json`;
        try {
          const resp = await fetch(url);
          if (!resp.ok) continue;
          const tool = await resp.json();
          tool.folder = folder;
          tools.push(tool);
        } catch (e) {
          // Ignore
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
      this.$emit('tab-event', { type: 'startTool', tool: this.selectedTool }, this.tab && this.tab.id);
    },
    cancel() {
      // Emit the cancel event so the parent can close the tab
      this.$emit('cancel');
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
        <div class="actions" style="display: flex; justify-content: center; gap: 18px; margin-top: 32px;">
          <button :disabled="!selectedTool" @click="startTool" class="themed-btn">Start</button>
          <button @click="cancel" class="themed-btn">Cancel</button>
          <button @click="loadTools" class="themed-btn">🔄 Refresh Addons</button>
        </div>
      </div>
    </div>
  `,
  // ...existing code...
}
