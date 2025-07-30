// main.js

// Utility: trim file name for tab
function trimFileName(name, maxLen = 18) {
  if (name.length <= maxLen) return name;
  const ext = name.includes('.') ? '.' + name.split('.').pop() : '';
  return name.slice(0, maxLen - ext.length - 3) + '...' + ext;
}
// Utility: parse preview-allowed.cfg
async function fetchPreviewAllowed() {
  try {
    const resp = await fetch('/preview-allowed.cfg', { cache: 'reload' });
    const text = await resp.text();
    const textExts = [];
    const imageExts = [];
    let group = '';
    text.split(/\r?\n/).forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      if (line === '[text]') group = 'text';
      else if (line === '[image]') group = 'image';
      else if (group === 'text') textExts.push(line.toLowerCase());
      else if (group === 'image') imageExts.push(line.toLowerCase());
    });
    // Defensive: always return arrays
    return { textExts: Array.isArray(textExts) ? textExts : [], imageExts: Array.isArray(imageExts) ? imageExts : [] };
  } catch (e) {
    return { textExts: [], imageExts: [] };
  }
}

const appOptions = {
  components: {},
  data() {
    return {
      theme: localStorage.getItem('theme') || 'dark',
      helpMenuOpen: false,
      fileMenuOpen: false,
      showWelcome: true,
      tabs: [],
      activeTab: '',
      draggingTab: null,
      dragOverTab: null,
      nextTabId: 1,
      files: [],
      selectedFile: null,
      orderMenuOpen: false,
      sidebarCollapsed: false,
    }
  },
  computed: {
    activeTabObj() {
      return this.tabs.find(t => t.id === this.activeTab) || null;
    }
  },
  mounted() {
    if (!this.showWelcome) {
      this.drawBackground();
    }
    window.addEventListener('resize', this.drawBackground);
    document.addEventListener('click', this.closeMenus);
    document.body.classList.toggle('light', this.theme === 'light');
  },
  watch: {
    theme(newTheme) {
      localStorage.setItem('theme', newTheme);
      document.body.classList.toggle('light', newTheme === 'light');
      this.drawBackground();
    },
    showWelcome(newVal) {
      if (!newVal) {
        this.$nextTick(() => this.drawBackground());
      }
    }
  },
  methods: {
    noop() {},
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
    },
    toggleHelpMenu() {
      this.helpMenuOpen = !this.helpMenuOpen;
      this.fileMenuOpen = false;
    },
    toggleFileMenu() {
      this.fileMenuOpen = !this.fileMenuOpen;
      this.helpMenuOpen = false;
    },
    closeMenus() {
      this.helpMenuOpen = false;
      this.fileMenuOpen = false;
    },
    enterApp() {
      this.showWelcome = false;
    },
    async fileAction(action) {
      const tab = this.activeTabObj;
      if (action === 'New') {
        if (!tab) {
          this.createTab('Untitled', 'generic', 'New tab content');
        } else {
          const comp = this.$options.components[this.tabComponent(tab)];
          const replace = comp && comp.noConfirmClose
            ? true
            : window.confirm(`Replace current tab ('${tab.title}') with a new one? (Cancel to create a new tab)`);
          if (replace) {
            tab.title = 'Untitled';
            tab.type = 'generic';
            tab.content = 'New tab content';
          } else {
            this.createTab('Untitled', 'generic', 'New tab content');
          }
        }
      } else if (action === 'Open') {
        if (!tab) {
          const fileName = window.prompt('Enter file name to open:', 'file.txt');
          if (!fileName) return;
          this.createTab(fileName, 'generic', `Loaded content from ${fileName}`);
        } else {
          const fileName = window.prompt('Enter file name to open:', 'file.txt');
          if (!fileName) return;
          const comp = this.$options.components[this.tabComponent(tab)];
          const replace = comp && comp.noConfirmClose
            ? true
            : window.confirm(`Replace current tab ('${tab.title}') with opened file? (Cancel to open in a new tab)`);
          if (replace) {
            tab.title = fileName;
            tab.type = 'generic';
            tab.content = `Loaded content from ${fileName}`;
          } else {
            this.createTab(fileName, 'generic', `Loaded content from ${fileName}`);
          }
        }
      } else if (action === 'Save') {
        const comp = tab && this.$options.components[this.tabComponent(tab)];
        if (tab && !(comp && comp.noConfirmClose)) window.alert(`Saved tab: '${tab.title}'`);
      } else if (action === 'Close') {
        if (tab) await this.closeTab(tab.id);
      } else if (action === 'Exit') {
        await this.closeAllTabsWithPrompt();
      }
      this.fileMenuOpen = false;
    },
    async closeAllTabsWithPrompt() {
      // Copy the tab ids to avoid mutation issues
      const tabIds = this.tabs.map(t => t.id);
      for (const tabId of tabIds) {
        // If the tab was already closed, skip
        if (!this.tabs.find(t => t.id === tabId)) continue;
        await this.closeTab(tabId);
      }
    },
    async closeTab(tabId) {
      const idx = this.tabs.findIndex(t => t.id === tabId);
      if (idx === -1) return;
      const tab = this.tabs[idx];
      const comp = this.$options.components[this.tabComponent(tab)];
      if (comp && comp.noConfirmClose) {
        // No confirmation, just close
        this.tabs.splice(idx, 1);
        if (this.activeTab === tabId) {
          this.activeTab = this.tabs[0]?.id || '';
        }
        return;
      }
      // First, ask if the user wants to close the tab
      const close = window.confirm(`Do you want to close tab: '${tab.title}'?`);
      if (!close) return;
      // Then, always prompt to save before closing
      const save = window.confirm(`Do you want to save before closing tab: '${tab.title}'?`);
      if (save) {
        window.alert(`Saved tab: '${tab.title}'`);
      }
      this.tabs.splice(idx, 1);
      if (this.activeTab === tabId) {
        this.activeTab = this.tabs[0]?.id || '';
      }
    },
    setActiveTab(tabId) {
      this.activeTab = tabId;
    },
    // Drag and drop logic for tabs
    onTabDragStart(idx, e) {
      this.draggingTab = idx;
      e.dataTransfer.effectAllowed = 'move';
    },
    onTabDragOver(idx, e) {
      if (this.draggingTab === null || this.draggingTab === idx) return;
      this.dragOverTab = idx;
    },
    onTabDrop(idx, e) {
      if (this.draggingTab === null || this.draggingTab === idx) return;
      const draggedTab = this.tabs[this.draggingTab];
      this.tabs.splice(this.draggingTab, 1);
      this.tabs.splice(idx, 0, draggedTab);
      if (this.activeTab === draggedTab.id) {
        this.activeTab = draggedTab.id;
      }
      this.draggingTab = null;
      this.dragOverTab = null;
    },
    onTabDragEnd() {
      this.draggingTab = null;
      this.dragOverTab = null;
    },
    openAboutTab() {
      let tab = this.tabs.find(t => t.type === 'about');
      if (!tab) {
        tab = this.createTab('About', 'about', '', true);
      }
      this.activeTab = tab.id;
      this.helpMenuOpen = false;
    },
    openSettingsTab() {
      let tab = this.tabs.find(t => t.type === 'settings');
      if (!tab) {
        tab = this.createTab('Settings', 'settings', '', true);
      }
      this.activeTab = tab.id;
      this.fileMenuOpen = false;
    },
    createTab(title, type, content, saved = false) {
      const id = 'tab' + this.nextTabId++;
      const tab = { id, title, type, content, saved };
      this.tabs.push(tab);
      this.activeTab = id;
      return tab;
    },
    tabComponent(tab) {
      if (!tab) return 'div';
      if (tab.type === 'about') return 'AboutTab';
      if (tab.type === 'settings') return 'SettingsTab';
      if (tab.type === 'preview-text') return 'PreviewTextTab';
      if (tab.type === 'preview-image') return 'PreviewImageTab';
      if (tab.type === 'preview-unsupported') return 'PreviewUnsupportedTab';
      return 'GenericTab';
    },
    onTabSave(tab) {
      tab.saved = true;
    },
    randomBetween(a, b) {
      return a + Math.random() * (b - a);
    },
    drawBackground() {
      if (this.showWelcome) return;
      const canvas = document.getElementById('bgCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const darkColors = ['#0f2027', '#2c5364', '#1a2980', '#000428', '#283e51', '#444', '#222'];
      const lightColors = ['#f8ffae', '#43cea2', '#185a9d', '#f7971e', '#ffd200', '#fff', '#eee'];
      const colors = this.theme === 'dark' ? darkColors : lightColors;

      ctx.fillStyle = this.theme === 'dark' ? '#111' : '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw random waves
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const amplitude = this.randomBetween(30, 80);
        const frequency = this.randomBetween(0.004, 0.012);
        const phase = this.randomBetween(0, Math.PI * 2);
        const yOffset = (canvas.height / 6) * (i + 1) + this.randomBetween(-30, 30);
        ctx.moveTo(0, yOffset);
        for (let x = 0; x <= canvas.width; x++) {
          const y = yOffset + Math.sin(x * frequency + phase) * amplitude;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = this.randomBetween(2, 5);
        ctx.globalAlpha = 0.5 + Math.random() * 0.5;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Draw random shapes (circles)
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        const x = this.randomBetween(0, canvas.width);
        const y = this.randomBetween(0, canvas.height);
        const radius = this.randomBetween(20, 80);
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = colors[Math.floor(this.randomBetween(0, colors.length))];
        ctx.globalAlpha = 0.1 + Math.random() * 0.2;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    loadFile() {
      this.$refs.fileInput.value = '';
      this.$refs.fileInput.click();
    },
    handleFileInput(e) {
      const file = e.target.files[0];
      if (file) {
        this.addFile(file);
      }
    },
    handleFileDrop(e) {
      const file = e.dataTransfer.files[0];
      if (file) {
        this.addFile(file);
      }
    },
    addFile(file) {
      // Extract extension, lowercase, no leading dot
      let ext = '';
      if (file.name && file.name.includes('.')) {
        ext = file.name.split('.').pop().toLowerCase();
      }
      const id = 'file' + Math.random().toString(36).slice(2, 10);
      const reader = new FileReader();
      reader.onload = (evt) => {
        let content = evt.target.result;
        let dataUrl = undefined;
        // If image, store dataUrl
        if (/^image\//.test(file.type)) {
          dataUrl = content;
          // Safari: don't decode large base64, just keep dataUrl for preview
        }
        this.files.push({
          id,
          name: file.name,
          ext,
          content,
          dataUrl
        });
      };
      // If image, read as data URL
      if (/^image\//.test(file.type)) reader.readAsDataURL(file);
      else reader.readAsText(file);
    },

    async previewFile() {
      if (!this.selectedFile) return;
      const { textExts, imageExts } = await fetchPreviewAllowed();
      // Normalize extension: remove leading dot, lowercase
      let ext = this.selectedFile.ext || '';
      if (ext.startsWith('.')) ext = ext.slice(1);
      ext = ext.toLowerCase();
      // Defensive: if no ext, try to extract from name
      if (!ext && this.selectedFile.name && this.selectedFile.name.includes('.')) {
        ext = this.selectedFile.name.split('.').pop().toLowerCase();
      }
      const isText = textExts.includes(ext);
      const isImage = imageExts.includes(ext);
      let tabTitle = trimFileName(this.selectedFile.name);
      if (isText) {
        this.createTab(tabTitle, 'preview-text', this.selectedFile.content);
      } else if (isImage) {
        // For images, pass a data URL
        let dataUrl = '';
        if (this.selectedFile.dataUrl) dataUrl = this.selectedFile.dataUrl;
        else if (this.selectedFile.content.startsWith('data:')) {
          dataUrl = this.selectedFile.content;
        } else {
          // Try to guess mime type
          let mime = 'image/' + (ext === 'jpg' ? 'jpeg' : ext);
          dataUrl = `data:${mime};base64,` + btoa(this.selectedFile.content);
        }
        this.createTab(tabTitle, 'preview-image', dataUrl);
      } else {
        this.createTab(tabTitle, 'preview-unsupported', `Preview not supported for .${ext} files.\nAllowed text: ${textExts.join(', ')}\nAllowed images: ${imageExts.join(', ')}`);
      }
    },
    selectFile(file) {
      this.selectedFile = file;
    },
    saveFile() {
      if (!this.selectedFile) return;
      // Create a blob with the file content
      const blob = new Blob([this.selectedFile.content], { type: 'text/plain' });
      // Create a temporary URL for the blob
      const url = URL.createObjectURL(blob);
      // Create a temporary anchor element to trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = this.selectedFile.name;
      // Trigger the download
      document.body.appendChild(a);
      a.click();
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      // Show success message
      window.alert(`File '${this.selectedFile.name}' has been saved!`);
    },
    deleteFile() {
      if (!this.selectedFile) return;
      const ok = window.confirm(`Delete file '${this.selectedFile.name}'?`);
      if (ok) {
        this.files = this.files.filter(f => f.id !== this.selectedFile.id);
        this.selectedFile = null;
      }
    },
    renameFile() {
      if (!this.selectedFile) return;
      const newName = window.prompt('Rename file:', this.selectedFile.name);
      if (newName && newName !== this.selectedFile.name) {
        this.selectedFile.name = newName;
        this.selectedFile.ext = newName.split('.').pop();
      }
    },
    duplicateFile() {
      if (!this.selectedFile) return;
      const copy = { ...this.selectedFile };
      copy.id = 'file' + Math.random().toString(36).slice(2, 10);
      copy.name = this.selectedFile.name.replace(/(\.[^.]*)?$/, '_copy$1');
      this.files.push(copy);
    },
    toggleOrderMenu() {
      this.orderMenuOpen = !this.orderMenuOpen;
    },
    orderFiles(by, asc) {
      if (by === 'name') {
        this.files.sort((a, b) => asc
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name));
      } else if (by === 'ext') {
        this.files.sort((a, b) => asc
          ? a.ext.localeCompare(b.ext)
          : b.ext.localeCompare(a.ext));
      }
      this.orderMenuOpen = false;
    },
  }
}

// Dynamically import all tab components and register them, then mount the app
Promise.all([
  import('./tabs/AboutTab.js'),
  import('./tabs/SettingsTab.js'),
  import('./tabs/GenericTab.js'),
  import('./tabs/PreviewTextTab.js'),
  import('./tabs/PreviewImageTab.js'),
  import('./tabs/PreviewUnsupportedTab.js')
]).then(([AboutTab, SettingsTab, GenericTab, PreviewTextTab, PreviewImageTab, PreviewUnsupportedTab]) => {
  appOptions.components.AboutTab = AboutTab.default;
  appOptions.components.SettingsTab = SettingsTab.default;
  appOptions.components.GenericTab = GenericTab.default;
  appOptions.components.PreviewTextTab = PreviewTextTab.default;
  appOptions.components.PreviewImageTab = PreviewImageTab.default;
  appOptions.components.PreviewUnsupportedTab = PreviewUnsupportedTab.default;
  Vue.createApp(appOptions).mount('#app');
});
