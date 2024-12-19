import {App, Notice, Plugin, PluginSettingTab, Setting} from 'obsidian';
import {exec} from 'child_process';

interface IAWriterPluginSettings {
	iaWriterPath: string;
}

const DEFAULT_SETTINGS: IAWriterPluginSettings = {
	iaWriterPath: '/Applications/iA Writer.app'
}

export default class IAWriterPlugin extends Plugin {
	settings: IAWriterPluginSettings;

	async onload() {
		await this.loadSettings();

		// 添加命令到Obsidian命令面板
		this.addCommand({
			id: 'open-in-ia-writer',
			name: 'Open current file in iA Writer',
			callback: () => this.openInIAWriter()
		});

		// 添加设置选项卡
		this.addSettingTab(new IAWriterSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	openInIAWriter() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice('没有打开任何文件');
			return;
		}

		const filePath = activeFile.path;
		const resourcePath = this.app.vault.adapter.getResourcePath(filePath);

		// 尝试从 resourcePath 中提取实际文件路径
		const match = resourcePath.match(/app:\/\/[^/]+(.+)\?/);
		const fullPath = match ? decodeURIComponent(match[1]) : null;

		if (!fullPath) {
			new Notice('无法获取文件路径');
			return;
		}

		console.log(`fullPath=${fullPath}`);

		// 使用MacOS的open命令打开文件
		exec(`open -a "${this.settings.iaWriterPath}" "${fullPath}"`, (error) => {
			if (error) {
				new Notice(`打开文件失败: ${error.message}`);
			} else {
				new Notice('已在iA Writer中打开文件');
			}
		});
	}
}

class IAWriterSettingTab extends PluginSettingTab {
	plugin: IAWriterPlugin;

	constructor(app: App, plugin: IAWriterPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('iA Writer 应用路径')
			.setDesc('设置iA Writer应用的完整路径')
			.addText(text => text
				.setPlaceholder('/Applications/iA Writer.app')
				.setValue(this.plugin.settings.iaWriterPath)
				.onChange(async (value) => {
					this.plugin.settings.iaWriterPath = value;
					await this.plugin.saveSettings();
				}));
	}
}
