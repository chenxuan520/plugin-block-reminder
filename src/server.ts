import {
    showMessage,
} from "siyuan";

export async function AddReminder(url: string, password: string, message: string, notifyTime: number): Promise<string> {
    console.log(url, password, message, notifyTime);
    try {
        const res = await fetch(url + "/api/notify", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': password
            },
            body: JSON.stringify({
                msg: {
                    title: "Siyuan_Reminder",
                    content: message
                },
                notify_time: notifyTime,
                notifications: [
                    "feishu"
                ]
            })
        });

        console.log(res);
        const data = await res.json();
        console.log(data);
        if (!res.ok || res.status !== 200) {
            showMessage("添加失败:" + data.data, 3000, "error");
            throw new Error('网络请求失败');
        } else {
            showMessage("添加成功:" + data.data.task_name, 2000, "info");
            console.log(data.data.task_name);
            return data.data.task_name;
        }
    } catch (err) {
        console.log(err);
        return "";
    }
}

export async function DelReminder(url: string, password: string, taskName: string) {
    console.log(url, password, taskName);
    fetch(url + "/api/cancel", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': password
        },
        body: JSON.stringify({
            task_name: taskName
        })
    }).then((res) => {
        console.log(res)
        res.json().then((data) => {
            console.log(data)
        })
        if (!res.ok || res.status !== 200) {
            showMessage("删除失败:" + res.body, 2000, "error");
        } else {
            showMessage("删除成功", 2000, "info");
        }
    }).catch((err) => {
        console.log(err)
        showMessage("删除失败:" + err, 2000, "error");
    })
}
