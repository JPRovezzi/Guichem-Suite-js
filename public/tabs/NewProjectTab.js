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
      showHelp: null, // track help popup per tool
      editMode: false,
      toolFolders: ['default'],
      newToolFolder: '',
      saving: false,
      saveError: ''
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
      let toolFolders = ['default'];
      try {
        const resp = await fetch('http://localhost:3001/api/tools?_=' + Date.now());
        if (resp.ok) {
          const manifest = await resp.json();
          if (manifest && Array.isArray(manifest.tools)) {
            toolFolders = manifest.tools;
            this.toolFolders = [...toolFolders];
          }
        }
      } catch (e) {
        console.warn('Could not load tools.json from backend:', e);
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

    enterEditMode() {
      this.editMode = true;
      this.saveError = '';
      this.newToolFolder = '';
    },
    exitEditMode() {
      this.editMode = false;
      this.saveError = '';
      this.newToolFolder = '';
    },
    addToolFolder() {
      const name = this.newToolFolder.trim();
      if (!name || this.toolFolders.includes(name)) return;
      this.toolFolders.push(name);
      this.newToolFolder = '';
    },
    removeToolFolder(idx) {
      this.toolFolders.splice(idx, 1);
    },
    async saveToolFolders() {
      this.saving = true;
      this.saveError = '';
      try {
        const resp = await fetch('http://localhost:3001/api/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tools: this.toolFolders })
        });
        if (!resp.ok) {
          const err = await resp.json();
          this.saveError = err.error || 'Failed to save.';
        } else {
          this.editMode = false;
          await this.loadTools();
        }
      } catch (e) {
        this.saveError = 'Failed to save: ' + e;
      }
      this.saving = false;
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
      <button @click="loadTools" style="margin-bottom: 12px; float: right;">🔄 Refresh Addons</button>
      <button @click="enterEditMode" style="margin-bottom: 12px; float: right; margin-right: 8px;">✏️ Edit Addons</button>
      <div style="clear: both;"></div>
      <div v-if="editMode">
        <h3>Edit Tool Folders</h3>
        <ul>
          <li v-for="(folder, idx) in toolFolders" :key="folder" style="display: flex; align-items: center;">
            <span>{{ folder }}</span>
            <button @click="removeToolFolder(idx)" style="margin-left: 8px; color: #c00;">🗑️</button>
          </li>
        </ul>
        <input v-model="newToolFolder" placeholder="New tool folder name" @keyup.enter="addToolFolder" style="margin-top: 8px;" />
        <button @click="addToolFolder" style="margin-left: 8px;">➕ Add</button>
        <div style="margin-top: 12px;">
          <button @click="saveToolFolders" :disabled="saving">💾 Save</button>
          <button @click="exitEditMode" style="margin-left: 8px;">Cancel</button>
        </div>
        <div v-if="saveError" style="color: #c00; margin-top: 8px;">{{ saveError }}</div>
      </div>
      <div v-else>
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
    </div>
  `
}
