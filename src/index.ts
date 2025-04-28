import {
    Plugin,
    showMessage,
    confirm,
    Dialog,
    getFrontend,
    getBackend,
    IModel,
    IOperation,
    ICard,
    ICardData,
    Protyle
} from "siyuan";
import "@/index.scss";

import HelloExample from "@/hello.svelte";
import SettingExample from "@/setting-example.svelte";

import {SettingUtils} from "./libs/setting-utils";
import {AddReminder, DelReminder} from "./server";

const STORAGE_NAME = "menu-config";
const TAB_TYPE = "custom_tab";
const REMIDER_ADDR_KEY = "reminder_addr";

function extractAndProcessDate(str: string): [number, string] {
    // 定义正则表达式来匹配 20240112-1203 格式的字符串
    const regex = /(\d{8})(?:-(\d{4}))?/;
    const match = str.match(regex);

    if (match) {
        let dateStr = match[1];
        let timeStr = match[2] || '1000';

        // 构建完整的日期时间字符串
        const fullDateTimeStr = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}:00`;

        // 将字符串转换为 Date 对象，然后获取时间戳
        const date = new Date(fullDateTimeStr);
        return [date.getTime(), fullDateTimeStr];
    }

    // 如果没有匹配到，返回当前时间的时间戳（这里只是示例，你可以根据需求调整）
    return [0, ""]
}

function formatDateTime(template: string) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return template
        .replace('yyyy', year.toString())
        .replace('MM', month)
        .replace('dd', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

export default class PluginSample extends Plugin {

    customTab: () => IModel;
    private blockIconEventBindThis = this.blockIconEvent.bind(this);
    private settingUtils: SettingUtils;

    async onload() {
        this.data[STORAGE_NAME] = {readonlyText: "Readonly"};

        console.log("loading plugin-sample", this.i18n);
        this.eventBus.on("click-blockicon", this.blockIconEventBindThis);

        // 图标的制作参见帮助文档
        this.addIcons(`<symbol id="iconFace" viewBox="0 0 32 32">
<path d="M13.667 17.333c0 0.92-0.747 1.667-1.667 1.667s-1.667-0.747-1.667-1.667 0.747-1.667 1.667-1.667 1.667 0.747 1.667 1.667zM20 15.667c-0.92 0-1.667 0.747-1.667 1.667s0.747 1.667 1.667 1.667 1.667-0.747 1.667-1.667-0.747-1.667-1.667-1.667zM29.333 16c0 7.36-5.973 13.333-13.333 13.333s-13.333-5.973-13.333-13.333 5.973-13.333 13.333-13.333 13.333 5.973 13.333 13.333zM14.213 5.493c1.867 3.093 5.253 5.173 9.12 5.173 0.613 0 1.213-0.067 1.787-0.16-1.867-3.093-5.253-5.173-9.12-5.173-0.613 0-1.213 0.067-1.787 0.16zM5.893 12.627c2.28-1.293 4.040-3.4 4.88-5.92-2.28 1.293-4.040 3.4-4.88 5.92zM26.667 16c0-1.040-0.16-2.040-0.44-2.987-0.933 0.2-1.893 0.32-2.893 0.32-4.173 0-7.893-1.92-10.347-4.92-1.4 3.413-4.187 6.093-7.653 7.4 0.013 0.053 0 0.12 0 0.187 0 5.88 4.787 10.667 10.667 10.667s10.667-4.787 10.667-10.667z"></path>
</symbol>
<symbol id="iconSaving" viewBox="0 0 32 32">
<path d="M20 13.333c0-0.733 0.6-1.333 1.333-1.333s1.333 0.6 1.333 1.333c0 0.733-0.6 1.333-1.333 1.333s-1.333-0.6-1.333-1.333zM10.667 12h6.667v-2.667h-6.667v2.667zM29.333 10v9.293l-3.76 1.253-2.24 7.453h-7.333v-2.667h-2.667v2.667h-7.333c0 0-3.333-11.28-3.333-15.333s3.28-7.333 7.333-7.333h6.667c1.213-1.613 3.147-2.667 5.333-2.667 1.107 0 2 0.893 2 2 0 0.28-0.053 0.533-0.16 0.773-0.187 0.453-0.347 0.973-0.427 1.533l3.027 3.027h2.893zM26.667 12.667h-1.333l-4.667-4.667c0-0.867 0.12-1.72 0.347-2.547-1.293 0.333-2.347 1.293-2.787 2.547h-8.227c-2.573 0-4.667 2.093-4.667 4.667 0 2.507 1.627 8.867 2.68 12.667h2.653v-2.667h8v2.667h2.68l2.067-6.867 3.253-1.093v-4.707z"></path>
</symbol>`);


        const statusIconTemp = document.createElement("template");
        statusIconTemp.innerHTML = `<div class="toolbar__item ariaLabel" aria-label="Remove plugin-sample Data">
    <svg>
        <use xlink:href="#iconTrashcan"></use>
    </svg>
</div>`;
        statusIconTemp.content.firstElementChild.addEventListener("click", () => {
            confirm("⚠️", this.i18n.confirmRemove.replace("${name}", this.name), () => {
                this.removeData(STORAGE_NAME).then(() => {
                    this.data[STORAGE_NAME] = {readonlyText: "Readonly"};
                    showMessage(`[${this.name}]: ${this.i18n.removedData}`);
                });
            });
        });
        this.settingUtils = new SettingUtils({
            plugin: this, name: STORAGE_NAME
        });
        this.settingUtils.addItem({
            key: "reminder_url",
            value: "",
            type: "textinput",
            title: "Reminder URL",
            description: "Begin with http/https",
            action: {
                // Called when focus is lost and content changes
                callback: () => {
                    // Return data and save it in real time
                    let value = this.settingUtils.takeAndSave("reminder_url");
                    console.log(value);
                }
            }
        });
        this.settingUtils.addItem({
            key: "reminder_pwd",
            value: "",
            type: "textinput",
            title: "Reminder Password",
            description: "",
            action: {
                // Called when focus is lost and content changes
                callback: () => {
                    // Return data and save it in real time
                    let value = this.settingUtils.takeAndSave("reminder_pwd");
                    console.log(value);
                }
            }
        });

        try {
            this.settingUtils.load();
        } catch (error) {
            console.error("Error loading settings storage, probably empty config json:", error);
        }

        let Templates = {
            cycle: {
                filter: ['cycle'],
                name: 'Reminder Cycle',
                template: 'yyyyMMdd-HHmm-1'
            },
            time: {
                filter: ['date', 'time', 'now'],
                name: 'Reminder Time',
                template: 'yyyyMMdd-HHmm'
            }
        };


        this.protyleSlash = Object.values(Templates).map((template) => {
            return {
                filter: template.filter,
                html: `<span>${template.name} ${formatDateTime(template.template)}</span>`,
                id: template.name,
                callback: (protyle: Protyle) => {
                    let strnow = formatDateTime(template.template);
                    console.log(template.name, strnow);
                    protyle.insert(strnow, false);
                },
                //@ts-ignore
                update() {
                    this.html = `<span>${template.name} ${formatDateTime(template.template)}</span>`;
                }
            }
        });

        console.log(this.i18n.helloPlugin);
    }

    onLayoutReady() {
        // this.loadData(STORAGE_NAME);
        this.settingUtils.load();
        console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);

        console.log(
            "Official settings value calling example:\n" +
            this.settingUtils.get("InputArea") + "\n" +
            this.settingUtils.get("Slider") + "\n" +
            this.settingUtils.get("Select") + "\n"
        );

        let tabDiv = document.createElement("div");
        new HelloExample({
            target: tabDiv,
            props: {
                app: this.app,
            }
        });
        this.customTab = this.addTab({
            type: TAB_TYPE,
            init() {
                this.element.appendChild(tabDiv);
                console.log(this.element);
            },
            beforeDestroy() {
                console.log("before destroy tab:", TAB_TYPE);
            },
            destroy() {
                console.log("destroy tab:", TAB_TYPE);
            }
        });
    }

    async onunload() {
        console.log(this.i18n.byePlugin);
        showMessage("Goodbye SiYuan Plugin");
        console.log("onunload");
    }

    uninstall() {
        console.log("uninstall");
    }

    async updateCards(options: ICardData) {
        options.cards.sort((a: ICard, b: ICard) => {
            if (a.blockID < b.blockID) {
                return -1;
            }
            if (a.blockID > b.blockID) {
                return 1;
            }
            return 0;
        });
        return options;
    }

    /**
     * A custom setting pannel provided by svelte
     */
    openDIYSetting(): void {
        let dialog = new Dialog({
            title: "SettingPannel",
            content: `<div id="SettingPanel" style="height: 100%;"></div>`,
            width: "800px",
            destroyCallback: (options) => {
                console.log("destroyCallback", options);
                //You'd better destroy the component when the dialog is closed
                pannel.$destroy();
            }
        });
        let pannel = new SettingExample({
            target: dialog.element.querySelector("#SettingPanel"),
        });
    }





    private blockIconEvent({detail}: any) {
        detail.menu.addItem({
            iconHTML: "",
            label: "Set Reminder",
            click: () => {
                const doOperations: IOperation[] = [];

                detail.blockElements.forEach((item: HTMLElement) => {
                    var [result, str] = extractAndProcessDate(item.textContent)
                    if (result === 0) {
                        showMessage("Invalid date format", 2000, "error");
                        return;
                    }
                    result /= 1000
                    console.log(result)
                    showMessage(`Set Reminder: ${result} Origin: ${str}`, 2000, "info");
                    if (this.settingUtils.get("reminder_url") === "" || this.settingUtils.get("reminder_pwd") === ""
                        || this.settingUtils.get("reminder_url") === undefined || this.settingUtils.get("reminder_pwd") === undefined) {
                        showMessage("Reminder URL and Password can not be empty", 2000, "error");
                        return;
                    }
                    AddReminder(this.settingUtils.get("reminder_url"), this.settingUtils.get("reminder_pwd"), item.textContent, result).then(taskName => {
                        console.log("add " + taskName);
                        item.setAttribute(REMIDER_ADDR_KEY, taskName);
                    })
                });
                detail.protyle.getInstance().transaction(doOperations);
            }
        });
        detail.menu.addItem({
            iconHTML: "",
            label: "Delete Reminder",
            click: () => {
                const doOperations: IOperation[] = [];
                detail.blockElements.forEach((item: HTMLElement) => {
                    if (this.settingUtils.get("reminder_url") === "" || this.settingUtils.get("reminder_pwd") === ""
                        || this.settingUtils.get("reminder_url") === undefined || this.settingUtils.get("reminder_pwd") === undefined) {
                        showMessage("Reminder URL and Password can not be empty", 2000, "error");
                        return;
                    }
                    if (item.getAttribute(REMIDER_ADDR_KEY) === null) {
                        showMessage("No reminder to delete", 2000, "error");
                        return;
                    }
                    showMessage(`Delete Reminder: ${item.getAttribute(REMIDER_ADDR_KEY)}`, 2000, "info");
                    console.log("del " + item.getAttribute(REMIDER_ADDR_KEY));
                    DelReminder(this.settingUtils.get("reminder_url"), this.settingUtils.get("reminder_pwd"), item.getAttribute(REMIDER_ADDR_KEY));
                    item.removeAttribute(REMIDER_ADDR_KEY);
                });
                detail.protyle.getInstance().transaction(doOperations);
            }
        });
    }



}
