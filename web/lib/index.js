import PhotoSwipeLightbox from '/extensions/Customized-ComfyUI-mixlab-nodes/lib/photoswipe-lightbox.esm.min.js'
// console.log(Lightbox)

import { api } from "../../../scripts/api.js";
// console.log('api', api)
const base64Df =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAALZJREFUKFOFkLERwjAQBPdbgBkInECGaMLUQDsE0AkRVRAYWqAByxldPPOWHwnw4OBGye1p50UDSoA+W2ABLPN7i+C5dyC6R/uiAUXRQCs0bXoNIu4QPQzAxDKxHoALOrZcqtiyR/T6CXw7+3IGHhkYcy6BOR2izwT8LptG8rbMiCRAUb+CQ6WzQVb0SNOi5Z2/nX35DRyb/ENazhpWKoGwrpD6nICp5c2qogc4of+c7QcrhgF4Aa/aoAFHiL+RAAAAAElFTkSuQmCC'


function get_url() {
    let api_host = `${window.location.hostname}:${window.location.port}`
    let api_base = ''
    let url = `${window.location.protocol}//${api_host}${api_base}`
    return url
}

async function uploadImage(blob, fileType = '.png', filename) {
    const body = new FormData()
    body.append(
        'image',
        new File([blob], (filename || new Date().getTime()) + fileType)
    )

    const url = get_url()

    const resp = await fetch(`${url}/upload/image`, {
        method: 'POST',
        body
    })

    let data = await resp.json()
    // console.log(data)
    let { name, subfolder } = data
    let src = `${url}/view?filename=${encodeURIComponent(
        name
    )}&type=input&subfolder=${subfolder}&rand=${Math.random()}`

    return { url: src, name }

};


const parseImageToBase64 = url => {
    return new Promise((res, rej) => {
        fetch(url)
            .then(response => response.blob())
            .then(blob => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    const base64data = reader.result
                    res(base64data)
                    // 在这里可以将base64数据用于进一步处理或显示图片
                }
                reader.readAsDataURL(blob)
            })
            .catch(error => {
                console.log('发生错误:', error)
            })
    })
}

//给load image to batch节点使用的输入
function createBase64ImageForLoadImageToBatch(imageElement, nodeId, bs) {
    let im = new Image()
    im.src = bs;
    im.className = "base64"
    imageElement.appendChild(im);

    let base64s = imageElement.querySelectorAll('.base64')
    //更新输入
    window._appData.data[nodeId].inputs.images.base64 = Array.from(base64s, (b) => b.src)

    // 删除
    im.addEventListener('click', e => {
        e.preventDefault();
        im.remove();
        let base64s = imageElement.querySelectorAll('.base64')
        //更新输入
        window._appData.data[nodeId].inputs.images.base64 = Array.from(base64s, (b) => b.src)
    })
}

const blobToBase64 = blob => {
    return new Promise((res, rej) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            const base64data = reader.result
            res(base64data)
            // 在这里可以将base64数据用于进一步处理或显示图片
        }
        reader.readAsDataURL(blob)
    })
}

function base64ToBlob(base64) {
    // 去除base64编码中的前缀
    const base64WithoutPrefix = base64.replace(/^data:image\/\w+;base64,/, '');

    // 将base64编码转换为字节数组
    const byteCharacters = atob(base64WithoutPrefix);

    // 创建一个存储字节数组的数组
    const byteArrays = [];

    // 将字节数组放入数组中
    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
        const slice = byteCharacters.slice(offset, offset + 1024);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    // 创建blob对象
    const blob = new Blob(byteArrays, { type: 'image/png' }); // 根据实际情况设置MIME类型

    return blob;
}


function editImage(img, data) {


    const update = async () => {
        const { imageData } = filerobotImageEditor.getCurrentImgData()
        let base64 = imageData.imageBase64;

        let fileBlob = base64ToBlob(base64)
        // // 获取读取的文件内容，即 Blob 对象
        let hashId = await calculateImageHash(fileBlob)

        if (hashId == window._appData.data[data.id].hashId) return

        let { url, name } = await uploadImage(fileBlob);
        // 在这里可以对 Blob 对象进行进一步处理
        // imageElement.src = url;
        window._appData.data[data.id].inputs.image = name;
        window._appData.data[data.id].hashId = hashId;

        console.log("上传的文件：", url, data.id, name);

        img.src = base64;
    }

    const { TABS, TOOLS } = FilerobotImageEditor;
    const config = {
        source: img.src,
        // loadableDesignState:{ //默认值
        //     annotations:{
        //         watermark:{
        //             image:'https://127.0.0.1:8189/view?filename=1703554480406.png&type=input&subfolder=&rand=0.044164708320141965',
        //             width:100,
        //             height:200,
        //             x:10,
        //             y:50,
        //             name: "Image",
        //             id:'watermark'
        //         }
        //     }
        // },
        // annotationsCommon: {
        //     fill: '#ff0000',
        // },
        // Text: { text: 'Filerobot...' },
        Rotate: { angle: 90, componentType: 'slider' },

        Crop: {
            presetsItems: [
                {
                    titleKey: 'classicTv',
                    descriptionKey: '4:3',
                    ratio: 4 / 3,
                    // icon: CropClassicTv,  
                },
                {
                    titleKey: 'cinemascope',
                    descriptionKey: '21:9',
                    ratio: 21 / 9,
                    // icon: CropCinemaScope, 
                },
            ],
            presetsFolders: [
                {
                    titleKey: 'socialMedia', // will be translated into Social Media as backend contains this translation key
                    // icon: Social, // optional,  
                    groups: [
                        {
                            titleKey: 'facebook',
                            items: [
                                {
                                    titleKey: 'profile',
                                    width: 180,
                                    height: 180,
                                    descriptionKey: 'fbProfileSize',
                                },
                                {
                                    titleKey: 'coverPhoto',
                                    width: 820,
                                    height: 312,
                                    descriptionKey: 'fbCoverPhotoSize',
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        tabsIds: [...Object.values(TABS)], // or ['Adjust', 'Annotate', 'Watermark']
        defaultTabId: TABS.WATERMARK, // or 'Annotate'
        defaultToolId: TOOLS.WATERMARK, // or 'Text'
        closeAfterSave: true
    };

    let editor = document.querySelector('#editor_container')
    // Assuming we have a div with id="editor_container"
    editor.style.display = 'block';
    // console.log(img,editor,data)
    document.body.style.overflow = 'hidden'

    const filerobotImageEditor = new FilerobotImageEditor(
        editor,
        config,
    );

    filerobotImageEditor.render({
        onSave: (editedImageObject, designState) => {
            console.log('saved', designState)
            //adjustments
            update()
        },
        onClose: (closingReason) => {
            console.log('Closing reason', closingReason);

            filerobotImageEditor.terminate();
            editor.style.display = 'none'
            document.body.style.overflow = 'auto'

        },
    });

}

async function getQueue(clientId) {
    try {

        const res = await fetch(`${get_url()}/queue`);
        const data = await res.json();
        return {
            // Running action uses a different endpoint for cancelling
            Running: Array.from(data.queue_running, prompt => {
                if (prompt[3].client_id === clientId) {
                    let prompt_id = prompt[1];
                    return {
                        prompt_id,
                        remove: () => interrupt(),
                    }
                }
            }),
            Pending: data.queue_pending.map((prompt) => ({ prompt })),
        };
    } catch (error) {
        console.error(error);
        return { Running: [], Pending: [] };
    }
}


async function interrupt() {
    try {
        await fetch(`${get_url()}/interrupt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: undefined
        });

    } catch (error) {
        console.error(error)
    }
    return true
}

// 种子的处理
function randomSeed(seed, data) {
    let max_seed = 4294967295
    //1849378600828930
    for (const id in data) {
        if (data[id].inputs.seed != undefined
            && !Array.isArray(data[id].inputs.seed) //如果是数组，则由其他节点控制
            && ['increment', 'decrement', 'randomize'].includes(seed[id])) {
            data[id].inputs.seed = Math.round(Math.random() * max_seed)
            // console.log('new Seed', data[id])
        }
        if (data[id].inputs.noise_seed != undefined
            && !Array.isArray(data[id].inputs.noise_seed) //如果是数组，则由其他节点控制
            && ['increment', 'decrement', 'randomize'].includes(seed[id])) {
            data[id].inputs.noise_seed = Math.round(Math.random() * max_seed)
        }
        // class_type:"Seed_"
        if (data[id].class_type == "Seed_" && ['increment', 'decrement', 'randomize'].includes(seed[id])) {
            data[id].inputs.seed = Math.round(Math.random() * max_seed)
        }
        console.log('new Seed', data[id])
    }
    return data
}

function updateSeed(id, val) {
    // console.log(val)
    if (window._appData.data[id].inputs.seed && !Array.isArray(window._appData.data[id].inputs.seed)) window._appData.data[id].inputs.seed = Math.round(val);
    if (window._appData.data[id].inputs.noise_seed && !Array.isArray(window._appData.data[id].inputs.noise_seed)) window._appData.data[id].inputs.noise_seed = Math.round(val);
}


function queuePrompt(appInfo, promptWorkflow, seed, client_id, origin_workflow) {
    // appinfo升级后 兼容，补丁
    for (const id in promptWorkflow) {
        if (promptWorkflow[id].class_type == 'AppInfo') {
            promptWorkflow[id].inputs.category = promptWorkflow[id].inputs.category || ""
        }
    }
    // 随机seed
    promptWorkflow = randomSeed(seed, promptWorkflow);

    let url = get_url()
    const data = JSON.stringify({
        client_id: client_id,
        prompt: promptWorkflow,
        extra_data: { extra_pnginfo: { workflow: origin_workflow } },
    });
    fetch(`${url}/prompt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: data,
    })
        .then(async response => {
            // Handle response here
            // console.log(response)
            let res = await response.json();
            window.prompt_ids[res.prompt_id] = {
                appInfo,
                prompt_id: res.prompt_id
            }
        })
        .catch(error => {
            // Handle error here
        });
}


function success(isSuccess, btn, text) {
    isSuccess ? btn.innerText = 'success' : text;
    setTimeout(() => {
        btn.innerText = text;
    }, 5000)
}

async function get_my_app(category = "", filename = null) {
    let url = get_url()
    const res = await fetch(`${url}/mixlab/workflow`, {
        method: 'POST',
        mode: 'cors', // 允许跨域请求
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            task: 'my_app',
            filename,
            category
        })
    })
    let result = await res.json();
    let data = [];
    try {
        for (const res of result.data) {
            let { output, app } = res.data;
            if (app.filename) data.push({
                ...app,
                data: output,
                date: res.date,
                origin_workflow: res.data.workflow
            })
        }
    } catch (error) {
    }

    // 排序 
    let appSelected = localStorage.getItem('app_selected')
    if (appSelected) {
        async function moveElementToFront(array, targetId) {

            for (let i = 0; i < array.length; i++) {
                if (array[i].id === targetId) {

                    if (i !== 0) {
                        const targetElement = array.splice(i, 1)[0];

                        let nt = (await get_my_app(targetElement.category, targetElement.filename))[0];

                        array.unshift(nt);
                    }
                    break;
                }
            }

            return array;
        }
        data = await moveElementToFront(data, appSelected)
    }

    return data
}


function createRightPane(outputData, link) {
    const container = document.createElement('div');
    container.className = "output";

    let isURL = false;
    try {
        new URL(link)
        isURL = true;
    } catch (error) {
        isURL = false;
    }

    let isAElement = undefined;
    try {
        let div = document.createElement('div');
        div.innerHTML = link;
        let a = div.querySelector('a');
        if (a.href) {
            new URL(a.href);
            isAElement = div.innerHTML;
        }
    } catch (error) {

    }
    // new URL(link)
    if (isURL || isAElement) {
        const linkBtn = document.createElement('button');

        if (isURL) {
            // linkBtn.href = link;
            linkBtn.innerText = 'go to'
        } else if (isAElement) {
            linkBtn.innerHTML = isAElement
        }

        action.appendChild(linkBtn)
        linkBtn.style.marginLeft = '18px';
        linkBtn.addEventListener('click', e => {

            if (isURL) {
                e.preventDefault();
                window.open(link);
            }
            //   if(isURL)  window.open(link);
        })

    }


    const output_card = document.createElement("div");
    output_card.className = 'output_card'
    container.appendChild(output_card);

    const download_btn=createDownloadEles();
    const promptSelect=createPromptSelections();
    //先运行以设置默认提示词
    valuePrompt();
    container.appendChild(promptSelect);
    container.appendChild(download_btn);

    for (const node of outputData) {
        // console.log('output', node)
        if (node.class_type == "ShowTextForGPT") {
            let div = document.createElement('div');
            div.className = "show_text"
            div.id = `output_${node.id}`;
            div.innerText = Array.isArray(node.inputs.text) ? node.inputs.text[0] : node.inputs.text
            output_card.appendChild(div);
        };

        if (node.class_type == "ClipInterrogator") {
            let div = document.createElement('div');
            div.className = "show_text";
            div.id = `output_${node.id}`;
            div.innerText = '#ClipInterrogator: …… '
            output_card.appendChild(div);
        };

        if (["SaveImage",
            "PreviewImage",
            "PromptImage",
            "Image Save",
            "SaveImageAndMetadata_",
            "TransparentImage"].includes(node.class_type)) {
            console.log('output#image', node)
            let a = document.createElement('a');
            a.id = `output_${node.id}`
            a.setAttribute('data-pswp-width', "200");
            a.setAttribute('data-pswp-height', "200");
            a.setAttribute('target', "_blank");
            a.setAttribute('href', base64Df);
            a.setAttribute('title', node.title);

            let img = new Image();
            // img;
            // img.src = window._appData?.icon || base64Df;
            a.appendChild(img)
            output_card.appendChild(a);
        }

        //3d 
        if (["SaveTripoSRMesh"].includes(node.class_type)) {
            let a = document.createElement('a');
            a.id = `output_${node.id}`
            a.setAttribute('data-pswp-width', "200");
            a.setAttribute('data-pswp-height', "200");
            a.setAttribute('target', "_blank");
            a.setAttribute('href', base64Df);

            let img = new Image();
            // img;
            img.src = base64Df;
            a.appendChild(img)
            output_card.appendChild(a);
        }

        // video ,gif
        if (["VHS_VideoCombine", "VideoCombine_Adv"].includes(node.class_type)) {

            let a = document.createElement('a');
            a.id = `output_${node.id}`
            a.setAttribute('data-pswp-width', "200");
            a.setAttribute('data-pswp-height', "200");
            a.setAttribute('target', "_blank");
            a.setAttribute('href', base64Df);

            // TODO 支持视频 https://photoswipe.com/custom-content/

            // let v = document.createElement('div');
            let video = document.createElement('video'), img = new Image();
            video.style.display = 'none'
            video.controls = 'true'
            video.autoplay = 'true'
            video.loop = 'true'
            // v.id = `output_${node.id}`;

            img.src = base64Df;

            a.appendChild(video);
            a.appendChild(img);
            output_card.appendChild(a);
        }

    }

    return container
}


function generateRainbowVideo() {

    // 创建一个canvas元素
    const canvas = document.createElement('canvas');
    canvas.width = 640; // 设置canvas宽度
    canvas.height = 480; // 设置canvas高度
    const context = canvas.getContext('2d');

    // 绘制第一帧彩虹
    context.fillStyle = 'red';
    context.fillRect(0, 0, canvas.width / 2, canvas.height);
    context.fillStyle = 'orange';
    context.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);

    // 绘制第二帧彩虹
    context.fillStyle = 'yellow';
    context.fillRect(0, 0, canvas.width / 2, canvas.height);
    context.fillStyle = 'green';
    context.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);

    const stream = canvas.captureStream();

    return new Promise((res, rej) => {
        // 导出视频
        const mediaRecorder = new MediaRecorder(stream);
        const chunks = [];
        mediaRecorder.ondataavailable = function (event) {
            chunks.push(event.data);
        };
        mediaRecorder.onstop = function () {
            const blob = new Blob(chunks, { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            res(url)
        };
        mediaRecorder.start();
        setTimeout(function () {
            mediaRecorder.stop();
        }, 1000); // 设置录制时长，这里设置为1秒
    })

}


async function calculateImageHash(blob) {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

async function handleClipboardImage(imageElement, data) {
    //data.class_type === 'LoadImagesToBatch'
    try {
        const clipboardItems = await navigator.clipboard.read();
        for (const clipboardItem of clipboardItems) {
            for (const type of clipboardItem.types) {

                if (type.startsWith('image/')) {
                    const fileBlob = await clipboardItem.getType(type);
                    // // 获取读取的文件内容，即 Blob 对象
                    let hashId = await calculateImageHash(fileBlob)

                    if (hashId == window._appData.data[data.id].hashId) return

                    if (data.class_type === 'LoadImagesToBatch') {
                        let base64 = await blobToBase64(fileBlob)
                        createBase64ImageForLoadImageToBatch(imageElement, data.id, base64)
                    } else {
                        let { url, name } = await uploadImage(fileBlob);
                        // 在这里可以对 Blob 对象进行进一步处理
                        imageElement.src = url;
                        window._appData.data[data.id].inputs.image = name;
                        window._appData.data[data.id].hashId = hashId;
                        console.log("上传的文件：", url, data.id, name);
                    }
                }
            }
        }
    } catch (error) {
        console.error('无法读取剪贴板中的图片:', error);
    }
}


function copyHtmlWithImagesToClipboard(data, cb) {
    // 创建一个临时div元素
    const tempDiv = document.createElement('div');

    // 将HTML字符串赋值给div的innerHTML属性
    tempDiv.innerHTML = data;

    // 获取div中的所有图像元素
    const images = tempDiv.getElementsByTagName('img');

    // 遍历图像元素，并将图像数据转换为Base64编码
    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        // 设置canvas尺寸与图像尺寸相同
        canvas.width = image.width;
        canvas.height = image.height;

        // 在canvas上绘制图像
        context.drawImage(image, 0, 0);

        // 将canvas转换为Base64编码
        const imageData = canvas.toDataURL();

        // 将Base64编码替换图像元素的src属性
        image.src = imageData;
    }


    let richText = tempDiv.innerHTML;

    // 创建一个新的Blob对象，并将富文本字符串作为数据传递进去
    const blob = new Blob([richText], { type: 'text/html' });

    // 创建一个ClipboardItem对象，并将Blob对象添加到其中
    const clipboardItem = new ClipboardItem({ 'text/html': blob });

    // 使用Clipboard API将内容复制到剪贴板
    navigator.clipboard.write([clipboardItem])
        .then(() => {
            console.log('富文本已成功复制到剪贴板');
            tempDiv.remove()
            if (cb) cb(true)
        })
        .catch((error) => {
            console.error('复制到剪贴板失败:', error);
            tempDiv.remove()
            if (cb) cb(false)
        });

}

// const htmlWithImages = "<p>这是要复制的HTML内容</p><img src='data:image/png;base64,iVBORw0KG...'>"
// copyHtmlWithImagesToClipboard(htmlWithImages);

function copyImagesToClipboard(html, cb) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const images = tempDiv.querySelectorAll('img');
    const promises = Array.from(images).map((image) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = image.src;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    const clipboardItem = new ClipboardItem({ 'image/png': blob });
                    navigator.clipboard.write([clipboardItem])
                        .then(() => {
                            resolve();
                            tempDiv.remove()
                            if (cb) cb(true)
                        })
                        .catch((error) => {
                            reject(error);
                            tempDiv.remove()
                            if (cb) cb(false)
                        });
                });
            };
        });
    });
    Promise.all([...promises])
        .then(() => {
            console.log('所有图片已成功复制到剪贴板');
            if (cb) cb(true)
            tempDiv.remove()
        })
        .catch((error) => {
            console.error('复制到剪贴板失败:', error);
            if (cb) cb(false)
            tempDiv.remove()
        });
}

function copyTextToClipboard(html, cb) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const text = tempDiv.innerText;
    const textData = new ClipboardItem({ 'text/plain': new Blob([text], { type: 'text/plain' }) });

    navigator.clipboard.write([textData])
        .then(() => {
            console.log('所有文本已成功复制到剪贴板', text);
            if (cb) cb(true)
            tempDiv.remove()
        })
        .catch((error) => {
            console.error('复制到剪贴板失败:', error);
            if (cb) cb(false)
            tempDiv.remove()
        });
}

function createInputs(inputData) {
    // Assuming you have an HTML element with the id "container" to hold the UI
    const container = document.createElement("div");
    const otherAdvancedContainer = document.createElement("div");
    otherAdvancedContainer.className = 'other_advanced_input';
    container.className = 'input_card';
    var uploadContainers=new Array(); // To sort the inputEle in UI.

    for (const ele of inputData){
        if (ele.class_type=="PhotoMakerEncodePlus"){
            window.photoMakerEncodePlus_id=ele.id;
        }
    }
    inputData = inputData.filter(inp => inp);
    // console.log('inputData',inputData)
    inputData.forEach(data => {
        console.log('inputData', data);

        // 图片 or 视频输入
        if (["LoadImage","VHS_LoadVideo","ImagesPrompt_","LoadImagesToBatch"].includes(data.class_type)) {

            let isVideoUpload = data.class_type === "VHS_LoadVideo";

            let isBase64Upload = data.class_type === "LoadImagesToBatch";

            // Create a container for the upload control
            const uploadContainer = document.createElement("div");
            uploadContainer.className = `card card_${data.class_type}`;

            // Create a label for the upload control
            const nameLabel = document.createElement("label");
            nameLabel.textContent = data.title || (isVideoUpload ? "LoadVideo: " : "LoadImage: ");
            nameLabel.style.marginBottom = '12px'

            uploadContainer.setAttribute("title",nameLabel.textContent);
            uploadContainer.appendChild(nameLabel);

            let actionDiv = document.createElement('div');
            actionDiv.style = `padding: 0 8px;padding-left: 50px;`

            // Create an input field for the image name
            const uploadImageInput = document.createElement("button");
            uploadImageInput.style = `width: 88px;`;
            uploadImageInput.innerText = 'upload'
            const uploadImageInputHide = document.createElement('input');
            uploadImageInputHide.type = "file";
            uploadImageInputHide.style.display = "none"
            actionDiv.appendChild(uploadImageInput);
            actionDiv.appendChild(uploadImageInputHide);

            const btnFromClipboard = document.createElement("button");
            btnFromClipboard.style = `width: 156px; margin-left: 18px;`
            btnFromClipboard.innerText = 'paste from clipboard'
            if (!isVideoUpload) actionDiv.appendChild(btnFromClipboard);

            const btnForImageEdit = document.createElement("button");
            btnForImageEdit.style = ` width: 32px; background: none;margin-left: 18px;`
            btnForImageEdit.innerHTML = '<?xml version="1.0" ?><svg version="1.1" style="width: 24px;" viewBox="0 0 50 50" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="Layer_1_1_"><path d="M18.293,31.707h6.414l24-24l-6.414-6.414l-24,24V31.707z M45.879,7.707l-3.586,3.586l-3.586-3.586l3.586-3.586   L45.879,7.707z M20.293,26.121l17-17l3.586,3.586l-17,17h-3.586V26.121z"/><polygon points="43.293,19.707 41.293,19.707 41.293,46.707 3.293,46.707 3.293,8.707 31.293,8.707 31.293,6.707 1.293,6.707    1.293,48.707 43.293,48.707  "/></g></svg>'
            if ((!isVideoUpload && !isBase64Upload) && data.class_type !== 'ImagesPrompt_') actionDiv.appendChild(btnForImageEdit);

            uploadContainer.appendChild(actionDiv)

            // Create an image element to display the uploaded image
            let imageElement = document.createElement("img");
            if (isVideoUpload) {
                // 视频
                imageElement = document.createElement('video');
                imageElement.setAttribute('controls', true)
                let [subfolder, name] = data.inputs.video.split('/');
                //    console.log(subfolder,name)
                if (!name) {
                    subfolder = "";
                    name = data.inputs.video;
                }
                let url = `${get_url()}/view?filename=${encodeURIComponent(name)}&type=input&subfolder=${subfolder}&rand=${Math.random()}`
                imageElement.src = url;

                // imageElement.innerHTML=`<img src="${base64Df}"/>`

            } else if (data.class_type === 'LoadImage') {
                // 图片
                let [subfolder, name] = data.inputs.image.split('/');
                if (!name) {
                    subfolder = "";
                    name = data.inputs.image;
                }
                // imageElement.src = base64Df
                let url = `${get_url()}/view?filename=${encodeURIComponent(name)}&type=input&subfolder=${subfolder}&rand=${Math.random()}`
                // 如果有默认图                        
                imageElement.src = data.options?.defaultImage || url;
                imageElement.setAttribute('onerror', `this.src='${base64Df}'`)

            } else if (data.class_type === 'ImagesPrompt_') {
                // 图片库模式
                const [imgDiv, mainImage] = createSelectForImages(
                    data.title,
                    data.options.images,
                    data.inputs.imageIndex,
                    (base64, text) => {
                        window._appData.data[data.id].inputs.image_base64 = base64;
                        window._appData.data[data.id].inputs.text = text;
                    })
                uploadContainer.appendChild(imgDiv);
                window._appData.data[data.id].inputs.image_base64 = mainImage.querySelector('.images_prompt_main').src;
            } else if (data.class_type === 'LoadImagesToBatch') {
                // 多张base64 图片
                let base64 = data.inputs.images.base64

                imageElement = document.createElement('div');
                imageElement.className = "images"
                for (const bs of base64) {
                    createBase64ImageForLoadImageToBatch(imageElement, data.id, bs)
                }

            }
            imageElement.style.maxWidth = '200px';

            if (!isVideoUpload) btnFromClipboard.addEventListener('click', (event) => handleClipboardImage(imageElement, data));

            if (!isVideoUpload && !isBase64Upload) btnForImageEdit.addEventListener('click', e => editImage(imageElement, data))

            uploadImageInput.addEventListener('click', (event) => {
                uploadImageInputHide.click()
            })
            uploadImageInputHide.addEventListener('change', (event) => {

                // 获取用户选择的文件
                const file = event.target.files[0];

                // 创建一个 FileReader 对象
                const reader = new FileReader();

                // 读取文件并在读取完成后执行回调函数
                reader.onloadend = async function () {
                    // 获取读取的文件内容，即 Blob 对象
                    const fileBlob = new Blob([reader.result], { type: file.type });
                    // console.log( file.type.split('/')[1])
                    let hashId = await calculateImageHash(fileBlob)

                    if (hashId == window._appData.data[data.id].hashId) return

                    if (data.class_type === 'LoadImagesToBatch') {
                        // 上传 ，转为base64
                        let base64 = await blobToBase64(fileBlob)
                        createBase64ImageForLoadImageToBatch(imageElement, data.id, base64)
                    } else {
                        //上传，返回url
                        let { url, name } = await uploadImage(fileBlob, '.' + file.type.split('/')[1])

                        if (data.class_type === 'ImagesPrompt_') {
                            // 
                            let base64 = await parseImageToBase64(url);
                            uploadContainer.querySelector('.images_prompt_main').src = base64
                            window._appData.data[data.id].inputs.image_base64 = base64;
                        } else {
                            if (isVideoUpload) {
                                imageElement.srcObject = null;
                            }
                            // 在这里可以对 Blob 对象进行进一步处理
                            imageElement.src = url;


                            if (isVideoUpload) {
                                window._appData.data[data.id].inputs.video = name;
                            } else {
                                window._appData.data[data.id].inputs.image = name;
                            }
                        }

                        window._appData.data[data.id].hashId = hashId;

                        console.log("上传的文件：", url, data.id, name);
                    }

                };

                // 开始读取文件
                reader.readAsArrayBuffer(file);


            })

            // imageElement.src = `${get_url()}/view?filename=${encodeURIComponent(data.inputs.image)}&type=${type}&subfolder=${subfolder}`;
            if (data.class_type !== 'ImagesPrompt_') uploadContainer.appendChild(imageElement);

            uploadContainer.setAttribute("comfyui_classtype",data.class_type);
            uploadContainer.setAttribute("sortIndex",0);
            uploadContainers.push(uploadContainer); // push to uploadContainers first
        }

        // 文本输入支持
        if (["TextInput_", "CLIPTextEncode", "PromptSimplification", "ChinesePrompt_Mix"].includes(data.class_type)) {
            // Create a container for the upload control
            const uploadContainer = document.createElement("div");
            uploadContainer.className = `card card_${data.class_type}`;

            // Create a label for the upload control
            const nameLabel = document.createElement("label");
            if (data.title.toLowerCase().includes("positive")){
                nameLabel.textContent="正向提示词";
            } else if (data.title.toLowerCase().includes("negative")){
                nameLabel.textContent="反向提示词";
            } else {
                nameLabel.textContent="提示词";
            }
            uploadContainer.appendChild(nameLabel);

            // Create an input field for the image name
            const textInput = document.createElement("textarea");
            if (data.title.toLowerCase().includes("positive")){
                window._positive_textarea=textInput;
            } else if (data.title.toLowerCase().includes("negative")){
                window._negative_textarea=textInput;
            }
            textInput.style.resize=null;
            // **photomaker clip encode 特殊处理！**
            textInput.setAttribute("title",data.title);
            // **photomaker clip encode 特殊处理！**
            if (data.class_type == "PromptSimplification") {
                textInput.value = data.inputs.prompt;
            } else {
                textInput.value = data.inputs.text;
            }

            // uploadImageInput.type = "text";
            let json = localStorage.getItem(`t_${data.id}`)
            try {
                // 缓存
                const { value, height } = JSON.parse(json);
                textInput.value = value;
                textInput.style.height = height;

                if (data.class_type == "PromptSimplification") {
                    window._appData.data[data.id].inputs.prompt = textInput.value;
                } else {
                    window._appData.data[data.id].inputs.text = textInput.value;
                }
            } catch (error) {}

            uploadContainer.appendChild(textInput);
            // autoResize(textInput);

            function autoResize(textarea) {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            }

            textInput.addEventListener('input', (event) => {
                // console.log(textInput.value)
                // autoResize(textInput);

                if (data.class_type == "PromptSimplification") {
                    window._appData.data[data.id].inputs.prompt = textInput.value;
                } else {
                    window._appData.data[data.id].inputs.text = textInput.value;
                    // **photomaker clip encode 特殊处理！**
                    if (
                        textInput.title.toLowerCase().includes("positive")
                        && window.hasOwnProperty("photoMakerEncodePlus_id")
                    ){
                        window._appData.data[window.photoMakerEncodePlus_id].inputs.text=textInput.value;
                    }
                    // **photomaker clip encode 特殊处理！**
                }
                localStorage.setItem(`t_${data.id}`, JSON.stringify({
                    value: textInput.value,
                    // height: textInput.style.height
                }));
            })

            uploadContainer.setAttribute("comfyui_classtype",data.class_type);
            uploadContainer.setAttribute("sortIndex",5);
            uploadContainers.push(uploadContainer); // push to uploadContainers first
        }

        // lora, checkpoint的输入支持
        if (["CheckpointLoaderSimple", "LoraLoader"].includes(data.class_type)) {
            let value = data.inputs.ckpt_name || data.inputs.lora_name;
            try {
                let t = '';
                if (data.class_type == 'CheckpointLoaderSimple') {
                    t = 'checkpoints'
                } else if (data.class_type == 'LoraLoader') {
                    t = 'loras'
                }
                if (t) {
                    var respData;
                    // const response = fetch(`${get_url()}/mixlab/folder_paths`, {
                    //     method: 'POST',
                    //     headers: {
                    //         'Content-Type': 'application/json'
                    //     },
                    //     body: JSON.stringify({ type: t })
                    // });
                    // const respData = response.json();
                    const requestObj = {
                        url: `${get_url()}/mixlab/folder_paths`,
                        method: 'POST',
                        headers: {'Content-Type':'application/json'},
                        body: {type: t},
                    }
                    syncJsonRequest(requestObj,"__mixlab_folderpaths_response");
                    if (window.hasOwnProperty("__mixlab_folderpaths_response")){
                        respData = window.__mixlab_folderpaths_response;
                    } else {
                        throw new Error("XHR to /mixlab/folder_paths error!");
                    }
                    data.options = respData.names;
                    console.log(data.names);
                }

            } catch (error) {
                console.error(error);
            }
            try {
                let v = localStorage.getItem(`_model_${data.id}_${data.class_type}`)
                if (v) {
                    value = v;
                    if (data.class_type === 'CheckpointLoaderSimple') {
                        window._appData.data[data.id].inputs.ckpt_name = value;
                    }
                    if (data.class_type === 'LoraLoader') {
                        window._appData.data[data.id].inputs.lora_name = value;
                    }
                }
            } catch (error) {

            }
            let [div, selectDom] = createSelectWithOptions(data.title, Array.from(data.options, o => {
                return {
                    value: o,
                    text: o
                }
            }), value, data.class_type);

            // 选择事件绑定
            selectDom.addEventListener('change', e => {
                e.preventDefault();
                // console.log(selectDom.value)
                if (data.class_type === 'CheckpointLoaderSimple') {
                    window._appData.data[data.id].inputs.ckpt_name = selectDom.value;
                }
                if (data.class_type === 'LoraLoader') {
                    window._appData.data[data.id].inputs.lora_name = selectDom.value;
                }

                localStorage.setItem(`_model_${data.id}_${data.class_type}`, selectDom.value)
            })

            div.setAttribute("comfyui_classtype",data.class_type);
            div.setAttribute("sortIndex",3);
            uploadContainers.push(div);
        }

        // 色彩选择器
        if (["Color"].includes(data.class_type)) {
            let value = data.inputs.color.hex || '#000000';
            let d = document.createElement('div');
            d.className = 'card';

            let label = document.createElement('label');
            label.innerText = data.title;

            let color = document.createElement('div');
            color.id = `color_input_${data.id}`;
            color.className = 'color_input';
            color.setAttribute('data-color', value);
            color.setAttribute('data-id', data.id);

            d.appendChild(label);
            d.appendChild(color);

            d.setAttribute("comfyui_classtype",data.class_type);
            d.setAttribute("sortIndex",4);
            uploadContainers.push(d);
        }

    });

    // sort the uploadContainers (bubble sort)
    for(var i=0; i<uploadContainers.length;i++){
        var end=uploadContainers.length;
        for (var j=0;j<end;j++){
            if (j+1==end){break}
            if (
                parseInt(uploadContainers[j].getAttribute("sortIndex"))
                > parseInt(uploadContainers[j+1].getAttribute("sortIndex"))
            ){
                arraySwap(uploadContainers,j,j+1);
            }
        }
        end-=1;
    };

    uploadContainers.forEach((ele,idx)=>{
        if( ele.getAttribute("title") && ele.title=='模板图' ){
            otherAdvancedContainer.appendChild(ele);
        } else if (["LoadImage","VHS_LoadVideo","ImagesPrompt_","LoadImagesToBatch"].includes(ele.getAttribute("comfyui_classtype"))){
            container.appendChild(ele);
        } else {
            otherAdvancedContainer.appendChild(ele);
        }
        
    })
    return [container, otherAdvancedContainer]
}

function createColorInput(elId, value, nodeId) {
    const pickr = Pickr.create({
        el: `#${elId}`,
        theme: 'classic',
        default: value,
        swatches: [
            'rgba(244, 67, 54, 1)',
            'rgba(233, 30, 99, 0.95)',
            'rgba(156, 39, 176, 0.9)',
            'rgba(103, 58, 183, 0.85)',
            'rgba(63, 81, 181, 0.8)',
            'rgba(33, 150, 243, 0.75)',
            'rgba(3, 169, 244, 0.7)',
            'rgba(0, 188, 212, 0.7)',
            'rgba(0, 150, 136, 0.75)',
            'rgba(76, 175, 80, 0.8)',
            'rgba(139, 195, 74, 0.85)',
            'rgba(205, 220, 57, 0.9)',
            'rgba(255, 235, 59, 0.95)',
            'rgba(255, 193, 7, 1)'
        ],
        components: {
            // Main components
            preview: true,
            opacity: true,
            hue: true,
            // Input / output Options
            interaction: {
                hex: true,
                rgba: true,
                hsla: true,
                hsva: true,
                cmyk: true,
                input: true,
                // clear: true,
                save: true,
                cancel: true
            }
        }
    });

    pickr
        .on('save', (color, instance) => {
            try {
                // console.log(color)
                // window._appData.data[data.id].inputs.color.hex = color.toHEXA().toString();
                let [r, g, b, a] = color.toRGBA();
                window._appData.data[nodeId].inputs.color = {
                    ...window._appData.data[nodeId].inputs.color,
                    r, g, b, a,
                    hex: color.toHEXA().toString()
                }
            } catch (error) { }
        })
        .on('cancel', instance => {
            pickr && pickr.hide()
        })
}

function createAllColorInput() {
    for (const cInp of document.querySelectorAll('.color_input')) {
        createColorInput(cInp.id, cInp.getAttribute('data-color'), cInp.getAttribute('data-id'));
    }
}

function createToggleBtn() {
    var toggleButton = document.createElement("button");
    toggleButton.innerHTML = `<svg style="width:24px;height: 24px;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3972"><path d="M514 114.3c-219.9 0-398.9 178.9-398.9 398.8 0.1 220 179 398.9 398.9 398.9 219.9 0 398.8-178.9 398.8-398.8S733.9 114.3 514 114.3z m218.3 489v1.7c0 0.5-0.1 1-0.1 1.6 0 0.3 0 0.6-0.1 0.9 0 0.5-0.1 1-0.2 1.5 0 0.3-0.1 0.7-0.1 1-0.1 0.4-0.1 0.8-0.2 1.2-0.1 0.4-0.2 0.9-0.2 1.3-0.1 0.3-0.1 0.6-0.2 0.8-0.1 0.6-0.3 1.2-0.4 1.8 0 0.1-0.1 0.2-0.1 0.3-2.2 8.5-6.6 16.6-13.3 23.3L600.7 755.4c-20 20-52.7 20-72.6 0-20-20-20-52.7 0-72.6l28.9-28.9H347c-28.3 0-51.4-23.1-51.4-51.4 0-28.3 23.1-51.4 51.4-51.4h334c13.2 0 26.4 5 36.4 15s15 23.2 15 36.4c0 0.3-0.1 0.6-0.1 0.8z m0.1-179.5c0 28.3-23.1 51.4-51.4 51.4H347c-13.2 0-26.4-5-36.4-15s-15-23.2-15-36.4v-0.8-1.6c0-0.5 0.1-1.1 0.1-1.6 0-0.3 0-0.6 0.1-0.9 0-0.5 0.1-1 0.2-1.5 0-0.3 0.1-0.7 0.1-1 0.1-0.4 0.1-0.8 0.2-1.2 0.1-0.4 0.2-0.9 0.2-1.3 0.1-0.3 0.1-0.6 0.2-0.8 0.1-0.6 0.3-1.2 0.4-1.8 0-0.1 0.1-0.2 0.1-0.3 2.2-8.5 6.6-16.6 13.3-23.3l116.6-116.6c20-20 52.7-20 72.6 0 20 20 20 52.7 0 72.6L471 372.5h210c28.2 0 51.4 23.1 51.4 51.3z" p-id="3973"></path></svg>`;
    toggleButton.className = 'toggle'
    return toggleButton
}

/**
 * @param {Boolean} defaultValue checkbox default value
 * @param {String} labelText checkbox title 
 * @returns {HTMLElement[]}
 */
function createCheckbox(defaultValue, labelText) {
    let div = document.createElement('div');
    // Create a checkbox element
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';

    // Set the default value
    checkbox.checked = defaultValue;

    // Create a label element
    var label = document.createElement('label');
    label.innerHTML = labelText;

    // Append the checkbox and label to the body or any other container element
    div.appendChild(checkbox);
    div.appendChild(label);

    return [div, checkbox]

}

/** 
 * @param labelText: innerHTML in label
 * @param value: no need to concern
 * @param callback: function to execute if slides
 * @param min&maxValue: min&max of slider input
 * @param type: typeof slider input value
 * @param 
*/
function createNumSlide(
    labelText, value = 0, callback,
    minValue = 0, maxValue = 1,
    type = 'float', keywords = null, targetId = null,
    createToggle = true
) {

    value = 'float' ? parseFloat(value.toFixed(3)) : parseInt(value)
    // 下注释代码的作用：每次刷新后，设置slider.value值为上次localStorage所存。
    // try {
    //     let i = parseFloat(localStorage.getItem(`_slider_${targetId}`))
    //     if (!!i) {
    //         value = i;
    //         callback && callback(value)
    //     }
    // } catch (error) {

    // }

    // 输入div
    let inputDiv = document.createElement('div');
    inputDiv.style.display = 'flex'

    // 创建滑块输入元素
    var slider = document.createElement("input");
    slider.type = "range";
    slider.min = minValue;
    slider.max = maxValue;
    slider.step = type == 'float' ? 0.01 : 1
    slider.value = value;
    slider.style.width = '80%';

    // 创建标签元素
    var label = document.createElement("label");
    label.innerHTML = labelText;
    label.setAttribute('data-content', value);

    if (keywords && keywords[0]) {
        // label.innerHTML = ``
        // 有备选的关键词

        let defaultValue = (targetId ? localStorage.getItem(`_slide_${targetId}`) : '') || keywords[0];

        window._appData.data[targetId].inputs.prompt_keyword = defaultValue;

        let selectTag = createSelect(Array.from(keywords, (k, i) => {
            return {
                value: k,
                text: k,
                selected: i == 0
            }
        }), defaultValue);

        selectTag.style = `background: none;
                            color: black;    max-width: 300px;
                            border-bottom: 1px solid #acacac;
                            border-radius: 0;`
        // selectTag.setAttribute('data-content',labelText);
        selectTag.addEventListener('change', e => {
            e.preventDefault();
            window._appData.data[targetId].inputs.prompt_keyword = selectTag.value;

            targetId ? localStorage.setItem(`_slide_${targetId}`, selectTag.value) : ''
        })
        label.appendChild(selectTag);
    }

    // 创建容器元素，并将滑块输入和标签添加到容器中
    var container = document.createElement("div");
    container.appendChild(label);

    container.className = 'card';


    // 创建切换按钮元素
    if (createToggle){
        var toggleButton = createToggleBtn()

        toggleButton.addEventListener("click", function () {
            if (slider.type === 'range') {
                slider.type = 'number'
            } else {
                slider.type = 'range'
            }
        });
        inputDiv.appendChild(toggleButton);
    }

    inputDiv.appendChild(slider);
    container.appendChild(inputDiv)

    // 先行修改为初始值
    callback(value);
    // 添加change事件监听器
    slider.addEventListener("input", function (event) {
        var value = event.target.value;
        value = type == 'float' ? value : Math.round(value)
        // console.log("滑块输入的值为：" + value);
        label.setAttribute('data-content', value);
        // 在这里可以执行其他操作，根据需要进行相应的处理
        callback && callback(value)

        localStorage.setItem(`_slider_${targetId}`, value)
    });

    // 返回容器元素
    return container;

}

function createImageForSelect(isMain, imgurl, keyword) {
    let im = new Image();
    im.className = isMain ? 'images_prompt_main' : ''
    im.src = imgurl;
    im.title = keyword
    im.style = `
    width:${isMain ? 120 : 56}px;
    height:auto;
    min-height:${isMain ? 120 : 56}px;
    filter: brightness(${isMain ? 1 : 0.8});
    ${isMain ? 'filter: drop-shadow(1px 1px 4px black);' : ''}
    `
    let p = document.createElement('p');
    p.innerText = keyword;
    p.style = `position: absolute;
top: 14px;
left: 20px;
background-color: #00000075;
padding: 2px 4px;
color: white;
font-size: 12px;`
    const div = document.createElement("div");
    // div.className = 'card';
    div.appendChild(im)
    if (isMain) div.appendChild(p)
    im.setAttribute('onerror', `this.src='${base64Df}'`)
    return div
}

// 创建图库选择
function createSelectForImages(title, options, index = 0, callback) {

    const div = document.createElement("div");
    // div.className = 'card';
    div.style = `margin-top: 24px;`

    // Create a label for the upload control
    // const nameLabel = document.createElement("label");
    // nameLabel.textContent = title;
    // div.appendChild(nameLabel);

    var mainImg = createImageForSelect(true, options[index].imgurl, options[index].keyword);
    div.appendChild(mainImg);

    let imgs = document.createElement('div');
    div.appendChild(imgs);
    imgs.style = `display:flex; flex-wrap: wrap;`
    for (const opt of options) {
        var selectElement = createImageForSelect(false, opt.imgurl, opt.keyword);
        imgs.appendChild(selectElement);
        selectElement.addEventListener('click', async e => {
            e.preventDefault();
            mainImg.querySelector('p').innerText = opt.keyword;
            mainImg.querySelector('img').src = opt.imgurl;
            if (callback) {
                if (!opt.imgurl.match('data:image')) {
                    opt.imgurl = await parseImageToBase64(opt.imgurl)
                }
                callback(opt.imgurl, opt.keyword);
            }
        })
    }

    return [div, mainImg];
}

// 创建下拉选择
function createSelect(options, defaultValue) {
    var selectElement = document.createElement("select");
    selectElement.className = "select"

    // 循环遍历选项数组
    for (var i = 0; i < options.length; i++) {
        var option = document.createElement("option");
        option.value = options[i].value;
        option.innerText = options[i].text;
        selectElement.appendChild(option);
        // if(options[i].selected) 
    }

    // 设置默认值
    selectElement.value = defaultValue;
    // console.log(defaultValue, options)
    return selectElement
}

/**
 * 创建下拉选择 - 带说明
 * @param {String} title selection title, bounded in <label> innerText
 * @param {Array} options selection options
 * @param {*} defaultValue default value in selection
 * @param {String} class_type to create unique class_type class
 * @returns {HTMLElement[]}
 */
function createSelectWithOptions(title, options, defaultValue, class_type=null) {

    const div = document.createElement("div");
    div.style="display: flex; flex-direction: column; align-items: center";
    if (!class_type) {div.className = 'card';} else { div.className = `card card_${class_type}`}

    // Create a label for the upload control
    const nameLabel = document.createElement("label");
    nameLabel.textContent = title;
    div.appendChild(nameLabel);

    var selectElement = createSelect(options, defaultValue);
    selectElement.style.width="100%";
    div.appendChild(selectElement)

    return [div, selectElement];
}

function getFilenameAndCategoryFromUrl(url) {
    const queryString = url.split('?')[1];
    if (!queryString) {
        return {};
    }

    const params = new URLSearchParams(queryString);

    const filename = params.get('filename') ? decodeURIComponent(params.get('filename')) : null;
    const category = params.get('category') ? decodeURIComponent(params.get('category') || '') : '';

    return { category, filename };
}

function createImage(url) {
    let im = new Image()
    return new Promise((res, rej) => {
        im.onload = () => res(im)
        im.src = url
    })
}

function createUI(data, share = true) {
    // appData.input, appData.output, appData.seed, share, appData.link
    if (!data) return
    const { input: inputData, output: outputData, data: workflow, seed, seedTitle, link, name } = data;

    let mainDiv = document.createElement('div');

    if (document.body.querySelector('#app_container')) document.body.querySelector('#app_container').remove()
    let appDetails = document.createElement('details');
    appDetails.id = "app_container"
    appDetails.setAttribute('open', true)
    appDetails.innerHTML = `<summary>${name}</summary>`;
    appDetails.style = `background: whitesmoke;
    color: black;
    padding: 12px;
    cursor: pointer;
    margin: 8px 44px;`


    let leftDetails = document.createElement('details');
    leftDetails.setAttribute('open', 'true')
    leftDetails.id = 'app_input_pannel'
    leftDetails.innerHTML = `<summary>INPUT</summary>
        <div class="content"></div>`;
    leftDetails.style.width="60%";
    let leftDiv = leftDetails.querySelector('.content');
    let rightDiv = document.createElement('div');

    mainDiv.className = 'app'
    leftDiv.className = 'panel'
    leftDiv.style.alignItems = 'flex-start';
    rightDiv.className = 'panel'
    leftDiv.style.flex = 0.4;
    rightDiv.style.flex = 1;
    // rightDiv.style.height='70vh'
    //         rightDiv.style=`position: fixed;
    // right: 0;
    // top: 12px;flex:0.6`

    // 创建标题
    let titleDiv = document.createElement('div');
    titleDiv.className = 'header'

    var title = document.createElement('h1');
    title.textContent = 'PhotoMaker-Test';
    titleDiv.appendChild(title);

    if (share) {
        const shareBtn = document.createElement('button');
        shareBtn.innerText = 'copy url';
        shareBtn.addEventListener('click', e => {
            e.preventDefault();
            let url = `${get_url()}/mixlab/app?filename=${encodeURIComponent(window._appData.filename)}&category=${encodeURIComponent(window._appData.category || '')}`;
            copyTextToClipboard(url, success(e, shareBtn, 'copy url'));
        })

        titleDiv.appendChild(shareBtn);
    }

    //删去description
    // let iconDes = document.createElement('div');
    // // 创建应用图标
    // var icon = document.createElement('img');
    // icon.style.width = '48px';
    // // icon.style.height = '98px';
    // icon.src = base64Df;

    // var des = document.createElement('p');
    // des.style = `margin-left: 12px; font-size: 14px;`
    // iconDes.appendChild(icon)
    // iconDes.appendChild(des);
    // iconDes.className = 'description'

    // 创建状态标签
    let statusDiv = document.createElement('div');
    statusDiv.className = 'status_seed'
    var status = document.createElement('div');
    status.textContent = 'Status';
    status.className = 'status';

    // seed 汇总
    var seeds = document.createElement('details');
    seeds.style="margin-left:-5px";
    // seeds.textContent = 'Status';
    seeds.className = 'seeds';

    try {
        if (Object.keys(seed).length > 0) {
            seeds.innerHTML = `<summary>SEED</summary>
        <div class="content"> </div>`;
            const content = seeds.querySelector('.content')
            for (const id in seed) {
                const s = seed[id];
                if (!Array.isArray(workflow[id].inputs.seed)) {

                    let seedInput = document.createElement('div');
                    content.appendChild(seedInput)
                    seedInput.style = `outline: 1px dashed gray;margin-bottom: 12px;margin-top: 12px;`

                    let em = document.createElement('em');
                    let emText = document.createElement('span');
                    emText.innerText = `#${seedTitle && seedTitle[id] ? seedTitle[id] : id} ${s.toUpperCase()}`;
                    em.appendChild(emText);

                    seedInput.appendChild(em)

                    if (s === 'fixed') {
                        // console.log('###fiex',1)
                        let inSeed = createNumSlide(``, 0, (newSeed) => updateSeed(id, newSeed), 0, 1849378600828930, 'int');
                        inSeed.style = `padding: 8px;background: none`

                        let toggleRandomize = createToggleBtn();
                        toggleRandomize.style = `background:none;color:black`;

                        toggleRandomize.addEventListener("click", function () {
                            if (data.seed[id] === 'randomize') {
                                data.seed[id] = 'fixed';
                                inSeed.style.display = 'block'
                            } else {
                                data.seed[id] = 'randomize';
                                inSeed.style.display = 'none'
                            }
                            emText.innerText = `#${seedTitle && seedTitle[id] ? seedTitle[id] : id} ${data.seed[id].toUpperCase()}`;
                        });

                        seedInput.appendChild(inSeed);
                        em.appendChild(toggleRandomize);

                    }

                }


            }
        }

    } catch (error) {
        console.log(error)
    }

    statusDiv.appendChild(status);
    statusDiv.appendChild(seeds);

    // 创建高级设置
    const advanced=document.createElement("details");
    advanced.style="margin-bottom: 20px; width:100%";
    advanced.className="advanced-config";
    let advanced_title=document.createElement("summary");
    advanced_title.innerText="高级设置";
    const kconfigEle=createKsampler(data);
    advanced.appendChild(advanced_title);
    advanced.appendChild(kconfigEle);

    // 创建输入框
    const [input1, otherAdvancedEles] = createInputs(inputData);

    //设置checkbox：是否使用高级设置里的提示词，默认false
    const [checkboxDiv,checkbox]=createCheckbox(false,"使用高级设置提示词");
    checkbox.addEventListener("change",e=>{
        if(checkbox.checked){window.__use_advanced_prompt=true;}
        else{window.__use_advanced_prompt=false};
    })
    // 提示词输入、ckp设置放入高级设置
    advanced.appendChild(checkboxDiv);
    advanced.appendChild(otherAdvancedEles);

    var output = createRightPane(outputData, link)

    // 创建提交按钮
    var submitButton = document.createElement('button');
    submitButton.textContent = 'Create';
    submitButton.className = 'run_btn';

    // 将所有UI元素添加到页面中
    leftDiv.appendChild(titleDiv);
    // leftDiv.appendChild(iconDes);
    // leftDiv.appendChild(des);
    leftDiv.appendChild(statusDiv);
    leftDiv.appendChild(input1);
    leftDiv.append(advanced);
    mainDiv.appendChild(submitButton);

    rightDiv.appendChild(output);

    mainDiv.appendChild(leftDetails);
    mainDiv.appendChild(rightDiv);

    appDetails.appendChild(mainDiv);
    document.body.appendChild(appDetails)

    // appDetails.addEventListener('toggle', e => {
    //     e.preventDefault();
    //     document.body.querySelector('#author').style.display = appDetails.open ? 'flex' : 'none'
    // })

    // 返回每个UI元素的引用和对应的更新方法
    return {
        title: {
            element: title,
            update: function (newTitle) {
                title.textContent = newTitle;
            }
        },
        // icon: {
        //     element: icon,
        //     update: function (newIconPath) {
        //         icon.src = newIconPath;
        //     }
        // },
        // des: {
        //     element: des,
        //     update: function (text) {
        //         des.textContent = text;
        //     }
        // },
        status: {
            element: status,
            update: function (newStatus) {
                status.textContent = newStatus;
            }
        },
        input1: {
            element: input1,
            update: function () {
                // 可以在这里添加上传图片的逻辑
            }
        },
        output: {
            element: output,
            update: async function (type = "image", val, id) {
                console.log(val, id)
                if (val && type == "image" && output.querySelector(`#output_${id} img`)) {

                    let im = await createImage(val)

                    output.querySelector(`#output_${id} img`).src = val;

                    let a = output.querySelector(`#output_${id}`);
                    a.setAttribute('data-pswp-width', im.naturalWidth);
                    a.setAttribute('data-pswp-height', im.naturalHeight);
                    a.setAttribute('target', "_blank");
                    a.setAttribute('href', val);
                }

                if (val && (type == "images" || type == 'images_prompts') && output.querySelector(`#output_${id} img`)) {
                    let imgDiv = output.querySelector(`#output_${id}`)
                    imgDiv.style.display = 'none';

                    // 清空
                    Array.from(imgDiv.parentElement.querySelectorAll('.output_images'), im => im.remove());

                    for (const v of val) {

                        let url = v, prompt = ''

                        if (type == 'images_prompts') {
                            // 是个数组，多了对应的prompt
                            url = v[0];
                            prompt = v[1];
                        }

                        let im = await createImage(url);

                        // 构建新的
                        let a = document.createElement('a');
                        a.className = `${imgDiv.id} output_images`
                        a.setAttribute('data-pswp-width', im.naturalWidth);
                        a.setAttribute('data-pswp-height', im.naturalHeight);
                        a.setAttribute('target', "_blank");
                        a.setAttribute('href', url);


                        let img = new Image();
                        // img;
                        img.src = url;
                        a.appendChild(img);

                        if (prompt) {
                            a.style.textDecoration = 'none';
                            let p = document.createElement('p')
                            p.className = 'prompt_image'
                            p.innerText = prompt;
                            a.appendChild(p)
                            img.alt = prompt
                        }

                        // imgDiv.parentElement.appendChild(a);
                        imgDiv.parentElement.insertBefore(a, imgDiv.parentElement.firstChild);
                        dlBtnBind("图片下载",url);
                    }

                }

                if (val && type == "video" && output.querySelector(`#output_${id} video`)) {

                    let video = output.querySelector(`#output_${id} video`);
                    let img = output.querySelector(`#output_${id} img`);
                    img.style.display = 'none';
                    video.style.display = 'block';

                    video.onloadeddata = function () {

                        let a = output.querySelector(`#output_${id}`);
                        a.setAttribute('data-pswp-width', video.videoWidth);
                        a.setAttribute('data-pswp-height', video.videoHeight);
                        a.setAttribute('target', "_blank");
                        a.setAttribute('href', val);
                    };

                    video.src = val;

                }

                if (val && type == "text" && output.querySelector(`#output_${id}`)) output.querySelector(`#output_${id}`).innerText = val;

                // 3d meshes
                if (val && type == 'meshes' && output.querySelector(`#output_${id}`)) {

                    let threeD = output.querySelector('.threeD')
                    //判断默认的图片，需要去掉后创建model-viewer
                    let imgDf = output.querySelector(`#output_${id} img`);
                    if (!threeD) {
                        if (imgDf) imgDf.parentElement.remove();
                        threeD = document.createElement('div');
                        threeD.className = 'threeD'
                        threeD.id = `output_${id}`
                        output.querySelector('.output_card').appendChild(threeD)
                        // output.insertBefore(threeD, output.firstChild);
                    };


                    for (const meshUrl of val) {
                        const modelViewer = document.createElement('div');
                        modelViewer.style = `width:300px;margin:4px;height:300px;display:block`
                        modelViewer.innerHTML = `<model-viewer  src="${meshUrl}" 
                            min-field-of-view="0deg" max-field-of-view="180deg"
                            shadow-intensity="1" 
                            camera-controls 
                            touch-action="pan-y"
                            style="width:300px;height:300px;"
                            > 
                            <div class="controls">
                                <button class="export">Save As</button>
                            </div>
                        </model-viewer>`

                        const btn = modelViewer.querySelector('.export');
                        btn.addEventListener('click', async e => {
                            e.preventDefault();
                            const glTF = await (modelViewer.querySelector('model-viewer')).exportScene()
                            const file = new File([glTF], 'mixlab.glb')
                            const link = document.createElement('a')
                            link.download = file.name
                            link.href = URL.createObjectURL(file)
                            link.click()
                        })
                        threeD.appendChild(modelViewer)
                    }

                }

            }
        },
        submitButton: {
            element: submitButton,
            update: function (runFn, cancelFn) {
                submitButton.addEventListener('dblclick', (e) => {
                    e.preventDefault()
                    submitButton.classList.remove('disabled');
                });
                submitButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    // 若是不调用高级设置的提示词，赋值常规提示词
                    if (!window.__use_advanced_prompt){
                        valuePrompt();
                    }

                    if (submitButton.classList.contains('data-click')) {
                        return
                    } else {
                        submitButton.classList.add('data-click')
                        setTimeout(() => submitButton.classList.remove('data-click'), 500)
                    }

                    if (!submitButton.classList.contains('disabled')) {
                        runFn && runFn();
                        submitButton.classList.add('disabled');
                        submitButton.innerText = 'Cancel'
                    } else {
                        // 如果能取消
                        let canCancel = cancelFn && cancelFn();
                        if (canCancel) submitButton.classList.remove('disabled');
                        if (canCancel) submitButton.innerText = 'Create';
                    }

                });
            },
            running: () => {
                submitButton.innerText = 'Cancel';
                if (!submitButton.classList.contains('disabled')) submitButton.classList.add('disabled');
            },
            reset: () => {
                submitButton.innerText = 'Create';
                submitButton.classList.remove('disabled');
                submitButton.classList.remove('data-click');
            }
        },
    };
}

function createUploadJson(detail) {

    // 创建一个div元素
    var div = document.createElement('div');
    div.className = 'upload_btn card'
    div.textContent = '上传并运行你的JSON文件';
    div.addEventListener('click', function () {
        document.getElementById('jsonFileInput').click();
    });

    // 创建一个input元素
    var input = document.createElement('input');
    input.type = 'file';
    input.id = 'jsonFileInput';
    input.style.display = 'none';
    input.addEventListener('change', function (event) {
        var file = event.target.files[0];
        var reader = new FileReader();
        reader.onload = function (e) {
            var contents = e.target.result;
            var jsonData = JSON.parse(contents);


            Array.from(detail.querySelectorAll('.card'), c => c.classList.remove('selected'));
            div.className = 'upload_btn card selected'

            let { output, app } = jsonData;

            window._appData = {
                ...app,
                data: output
            };
            if (document.body.querySelector('.app')) document.body.querySelector('.app').remove()
            createApp(window._appData, false);

            // res(jsonData);
        };
        reader.readAsText(file);
    });

    // 将div和input元素添加到body中
    // document.body.appendChild(div);
    document.body.appendChild(input);
    return div
}

function executed(detail, show) {
    console.log('#executed', window.prompt_ids, detail)
    if (detail?.node
        && window.prompt_ids[detail.prompt_id]
        && window._appData?.output.filter(f => f.id === detail.node)[0]) {
        // 保存结果到记录里
        window.prompt_ids[detail.prompt_id].data = detail
        window.prompt_ids[detail.prompt_id].createTime = (new Date()).getTime()
        savePromptResult({
            ...window.prompt_ids[detail.prompt_id],
            prompt_id: detail.prompt_id
        })
    }
    // if (!enabled) return;
    const images = detail?.output?.images;
    const text = detail?.output?.text;
    const gifs = detail?.output?.gifs;

    const prompt = detail?.output?.prompt;
    const analysis = detail?.output?.analysis;

    const _images = detail?.output?._images;
    const prompts = detail?.output?.prompts;

    // 3d模型
    const meshes = detail?.output?.mesh;

    if (images) {
        // if (!images) return;

        let url = get_url();

        show(Array.from(images, img => {
            return `${url}/view?filename=${encodeURIComponent(img.filename)}&type=${img.type}&subfolder=${encodeURIComponent(img.subfolder)}&t=${+new Date()}`;
        }), detail.node, 'images');

    } else if (meshes) {
        //多个
        let url = get_url();

        show(Array.from(meshes, mesh => {
            return `${url}/view?filename=${encodeURIComponent(mesh.filename)}&type=${mesh.type}&subfolder=${encodeURIComponent(mesh.subfolder)}&t=${+new Date()}`;
        }), detail.node, 'meshes');

    } else if (_images && prompts) {
        let url = get_url();

        let items = [];
        // 支持图片的batch
        Array.from(_images, (imgs, i) => {

            for (const img of imgs) {
                items.push([`${url}/view?filename=${encodeURIComponent(img.filename)
                    }&type=${img.type}&subfolder=${encodeURIComponent(img.subfolder)
                    }&t=${+new Date()}`, prompts[i]])
            }

        })

        show(items, detail.node, 'images_prompts');

    } else if (text) {
        show(Array.isArray(text) ? text.join('\n\n') : text, detail.node, 'text')
    } else if (gifs && gifs[0]) {
        // if (!images) return; 
        const src = `${get_url()}/view?filename=${encodeURIComponent(gifs[0].filename)}&type=${gifs[0].type}&subfolder=${encodeURIComponent(gifs[0].subfolder)
            }&&format=${gifs[0].format}&t=${+new Date()}`;

        show(src, detail.node, gifs[0].format.match('video') ? 'video' : 'image');
    } else if (prompt && analysis) {
        // #ClipInterrogator: …… 
        show(`${prompt.join('\n\n')}\n${JSON.stringify(analysis, null, 2)}`, detail.node, 'text')
    }
}

async function createApp(appData, share = false) {
    // console.log(appData)
    // 使用示例：
    var ui = createUI(appData, share);

    // 更新标题
    ui.title.update(appData.name || 'Mixlab APP');

    // 更新应用图标
    // ui.icon.update(appData.icon || base64Df);

    // ui.des.update(appData.description || '-');

    // 更新状态标签
    ui.status.update(appData ? 'READY' : '-');

    // 添加提交按钮点击事件
    ui.submitButton.update(
        () => {
            // 在提交按钮点击时执行的逻辑
            queuePrompt({
                name: window._appData.name,
                id: window._appData.id,
                icon: window._appData.icon,
                category: window._appData.category,
                filename: window._appData.filename
            }, window._appData.data, window._appData.seed, api.clientId,
            window._appData.origin_workflow);
        }, () => {
            // 取消
            if (api.runningCancel) {
                api.runningCancel();
                api.runningCancel = null;
                return true
            }

        });


    const show = (src, id, type = "image") => {
        // console.log(src)
        ui.output.update(type, src, id)
    };
    // 暴露给history使用
    window._show = show;

    api.addEventListener("status", ({ detail }) => {
        console.log("status", detail, detail?.exec_info?.queue_remaining);
        try {
            ui.status.update(`queue#${detail.exec_info?.queue_remaining}`);
            window.parent.postMessage({ cmd: 'status', data: `queue#${detail.exec_info?.queue_remaining}` }, '*');
            if (detail.exec_info?.queue_remaining === 0) {
                // 运行按钮重设
                ui.submitButton.reset()
                console.log('运行按钮重设')
            }
        } catch (error) {
            console.log(error)
            window.parent.postMessage({ cmd: 'status' }, '*');
        }

    });

    api.addEventListener("progress", ({ detail }) => {
        console.log("progress", detail);
        const class_type = window._appData.data[detail?.node]?.class_type || ''
        try {
            ui.status.update(`${parseFloat(100 * detail.value / detail.max).toFixed(1)}% ${class_type}`);
            ui.submitButton.running()
        } catch (error) {

        }
    });

    api.addEventListener("executed", async ({ detail }) => {
        console.log("executed", detail)
        executed(detail, show);

        try {
            ui.status.update(`executed_#${window._appData.data[detail.node]?.class_type}`);
            ui.submitButton.reset()
        } catch (error) {

        }

        // console.log(Running, Pending);
        try {
            const { Running, Pending } = await getQueue(api.clientId);
            if (Running && Running[0]) {
                api.runningCancel = Running[0].remove;
                ui.submitButton.running()
            } else {
                api.runningCancel = null;
            }
        } catch (error) {
            api.runningCancel = null;
        }

    });

    // api.addEventListener("b_preview", ({ detail }) => {
    //     // if (!enabled) return;
    //     console.log("b_preview", detail)
    //     show(URL.createObjectURL(detail));
    // });
    api.addEventListener("execution_error", ({ detail }) => {

        console.log("execution_error", detail)
        window.parent.postMessage({ cmd: 'status', data: `execution_error:${JSON.stringify(detail)}` }, '*');
        // show(URL.createObjectURL(detail));
    });


    api.addEventListener('execution_start', async ({ detail }) => {
        console.log("execution_start", detail)
        try {
            ui.status.update(`execution_start`);
            ui.submitButton.running()
        } catch (error) {

        }

        try {
            const { Running, Pending } = await getQueue(api.clientId);
            if (Running && Running[0]) {
                api.runningCancel = Running[0].remove;
            } else {
                api.runningCancel = null;
            }
        } catch (error) {
            api.runningCancel = null;
        }
    })

    api.api_base = ""
    api.init();

    // 外挂的UI
    createAllColorInput();


    const lightbox = new PhotoSwipeLightbox({
        gallery: '.output_card',
        children: 'a',
        pswpModule: () => import('/extensions/Customized-ComfyUI-mixlab-nodes/lib/photoswipe.esm.min.js')
    });
    lightbox.on('uiRegister', function () {
        lightbox.pswp.ui.registerElement({
            name: 'custom-caption',
            order: 9,
            isButton: false,
            appendTo: 'root',
            html: 'Caption text',
            onInit: (el, pswp) => {
                lightbox.pswp.on('change', () => {
                    const currSlideElement = lightbox.pswp.currSlide.data.element
                    let captionHTML = ''
                    if (currSlideElement) {
                        const hiddenCaption = currSlideElement.querySelector(
                            '.hidden-caption-content'
                        )
                        if (hiddenCaption) {
                            // get caption from element with class hidden-caption-content
                            captionHTML = hiddenCaption.innerHTML
                        } else {
                            // get caption from alt attribute
                            captionHTML = currSlideElement
                                .querySelector('img')
                                .getAttribute('alt')
                        }
                    }
                    el.innerHTML = captionHTML || ''
                })
            }
        })
    })
    lightbox.init();
    // window._lightbox = lightbox

    // lightbox.addFilter('preventPointerEvent', (preventPointerEvent, originalEvent, pointerType) => {
    //     // return true to preventDefault pointermove/pointerdown events
    //     // (also applies to touchmove/mousemove)
    //     return true;
    // });

    // author信息
    // if (appData.author) {
    //     let div = document.body.querySelector('#author');
    //     if (appData.author.link) div.href = appData.author.link
    //     div.style = `z-index:20;display: flex;flex-direction: column;position: fixed;bottom: 12px;right: 24px;cursor: pointer;text-decoration: none;color: black;`
    //     div.innerHTML = `<p style="font-size:12px">Author:</p>
    //     <div style="display: flex;"> <img style="width:32px;height:32px;border-radius: 100%;" 
    //     src="${appData.author.avatar || base64Df}"/>
    //     <p style="margin-left:8px;font-size:12px;font-weight:800">${appData.author.name || '-'}</p></div>`
    // }

}

// 创建app的选择菜单
function createAppList(apps = [], innerApp = false) {
    window.prompt_ids = {};
    if (document.body.querySelector('.apps')) {
        document.body.querySelector('.apps').remove()
    }
    let details = document.createElement('details');
    details.className = 'apps';

    details.innerHTML = `<summary>APP Store / ${apps.length}</summary>
        <div class="content"> </div>`

    let div = details.querySelector('div');

    for (let index = 0; index < apps.length; index++) {
        const app = apps[index];
        let d = document.createDocumentFragment();
        let dd = document.createElement('div');
        d.appendChild(dd);
        dd.className = 'card' + (index == 0 ? ' selected' : '')
        dd.innerHTML = ` 
                <div class="item icon">
                    <img src="${app.icon || base64Df}"/>
                </div>
                <div class="item" style="margin-left: 24px;">
                    <div>
                        <h5>${app.name}</h5>
                        <p>${app.description}</p>
                    </div>
                    <div >
                        <p class="version">Version: ${app.version}</p> 
                    </div>
                    <br>
                    ${app.author && app.author.name ? `<p class="version">Author:</p><div 
                    style="display: flex;justify-content: center;align-items: center;margin-top: 8px;"> 
                        <img style="width:28px;height:28px;border-radius: 100%;" 
                        src="${app.author.avatar || base64Df}"/>
                        <p class="version" style="margin-left: 12px;">${app.author.name}</p> 
                    </div>`: ''}
                </div>
              `


        div.appendChild(d);
        dd.addEventListener('click', async e => {
            e.preventDefault();
            Array.from(div.querySelectorAll('.card'), c => c.classList.remove('selected'));
            dd.className = 'card selected'

            details.removeAttribute('open');
            let res = (await get_my_app(app.category, app.filename)).filter(n => n.filename === app.filename)[0];

            if (res) {
                window._appData = res;
                if (document.body.querySelector('.app')) document.body.querySelector('.app').remove()
                createApp(window._appData);
                localStorage.setItem('app_selected', window._appData.id)
            }

        })
        // console.log(div)
    };

    if (!innerApp) {
        let uploadApp = createUploadJson(details);
        div.appendChild(uploadApp);
    }

    document.body.appendChild(details);
    details.addEventListener('toggle', e => {
        e.preventDefault();
        if (document.body.querySelector('#app_container')) {
            document.body.querySelector('#app_container').removeAttribute('open');
            // document.body.querySelector('#author').style.display = 'none'
        }
    })
}

// 请求历史数据
async function getPromptResult(category) {
    let url = get_url()
    try {
        const response = await fetch(`${url}/mixlab/prompt_result`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                action: "all",
            }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log("#getPromptResult:", category, data);

            return data.result.filter(r => r.appInfo.category == category)
            // 处理返回的数据
        } else {
            console.log("Error:", response.status);
            // 处理错误情况
        }
    } catch (error) {
        console.log("Error:", error);
        // 处理异常情况
    }
}

// 保存历史数据
async function savePromptResult(data) {
    let url = get_url()
    try {
        const response = await fetch(`${url}/mixlab/prompt_result`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                action: "save",
                data
            }),
        });

        if (response.ok) {
            const res = await response.json();
            console.log("Response:", res);
            return res
            // 处理返回的数据
        } else {
            console.log("Error:", response.status);
            // 处理错误情况
        }
    } catch (error) {
        console.log("Error:", error);
        // 处理异常情况
    }
}

async function createHistoryList(category) {
    if (document.body.querySelector('#history_container')) document.body.querySelector('#history_container').remove();

    window._historyData = await getPromptResult(category);

    if (!window._historyData || (window._historyData && window._historyData.length === 0)) return

    let details = document.createElement('details');
    details.id = "history_container"
    details.innerHTML = `<summary>历史</summary>`;
    details.style = `background: whitesmoke;
    color: black;
    padding: 12px;
    cursor: pointer;
    margin: 8px 44px;`;

    details.addEventListener('toggle', function (event) {
        if (details.open) {
            // console.log('details被展开了');
            // 在这里执行展开后的回调操作
            if (document.body.querySelector('#app_container')) {
                document.body.querySelector('#app_container').removeAttribute('open')
            }
            if (document.body.querySelector('.apps')) {
                document.body.querySelector('.apps').removeAttribute('open')
            }
        } else {
            // console.log('details被收起了');
            // 在这里执行收起后的回调操作
            if (document.body.querySelector('#app_container')) {
                document.body.querySelector('#app_container').removeAttribute('open')
            }
            if (document.body.querySelector('.apps')) {
                document.body.querySelector('.apps').removeAttribute('open')
            }
        }
    });


    let cards = document.createElement('div');
    cards.style = `display: flex;flex-wrap: wrap;`

    const addCard = (title, createTime, imgurl) => {
        let card = document.createElement('div')
        card.className = 'card';
        card.innerHTML = `<div class="item icon">
                    <img src="${imgurl || base64Df}"/>
                    </div>
                <div class="item" style="margin-left: 24px;">
                    <div>
                        <h5>${title}</h5>
                        <p></p>
                    </div>
                    <div>
                        <p class="version">${new Date(createTime || (new Date()))}</p>
                        
                    </div>
                </div>`
        return card
    }

    for (const c of window._historyData) {
        let card = addCard(c.appInfo.name, c.createTime, c.appInfo.icon)
        cards.appendChild(card)
        card.addEventListener('click', async e => {
            e.preventDefault();
            // console.log(c)

            const { category, filename } = c.appInfo;
            window._appData = (await get_my_app(category, filename))[0];

            await createApp(window._appData);

            executed(c.data, window._show);

            try {
                document.body.querySelector('#app_container').setAttribute('open', true)
                document.body.querySelector('#app_input_pannel').removeAttribute('open')
                document.body.querySelector('.apps').removeAttribute('open')
            } catch (error) {
                console.log(error)
            }
        })
    }

    details.appendChild(cards);

    document.body.appendChild(details);
}

async function init_app() {
    const innerApp = checkIsInnerApp();

    if (!innerApp) {
        const { category, filename } = getFilenameAndCategoryFromUrl(location.href);
        window._apps = await get_my_app(category, filename);
        window._appData = window._apps[0];
        createAppList(window._apps);
        if (window._apps.length > 0) await createHistoryList(category || '');
        createApp(window._appData);
    }

};

init_app();

// 支持内嵌app
function checkIsInnerApp() {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const innerApp = params.get("innerApp");
    // console.log(window.location.href, innerApp == 1, document.body);
    if (innerApp == 1) {
        document.body.querySelector('.header').style.display = 'none';
        window.parent.postMessage({ innerApp, cmd: 'init' }, '*');

        // 在iframe中监听来自父窗口的消息
        window.addEventListener("message", async function (event) {
            console.log("Received message from parent:", event.data);
            const { init, url } = event.data;

            window._hostUrl = url;
            window._apps = init;
            window._appData = window._apps[0];

            if (window._appData) {
                createAppList(window._apps, innerApp);
                // await createHistoryList();
                createApp(window._appData);
            } else {
                // todo welcome页面
                document.body.innerHTML = `<h3 style="padding: 99px;">Welcome to Mixlab Nodes App!</h3>`
            }



        });
    }

    return innerApp == 1
}

function updateKSampler(KSampler_id, name, type, val){
    if (!["string",'float','int'].includes(type)){
        throw new Error(`param in Ksampler update only support string,float and int, input type: ${type}`)
    }
    if (
        !["steps","cfg","sampler_name","scheduler","denoise"].includes(name)
    ){ throw new Error(`KSampler doesn't have param: ${name} !!`)}
    var kSampler = window._appData.data[KSampler_id];
    if (kSampler.class_type!="KSampler") {throw new Error("id Passed in not KSampler's!!")}
    else {
        if(type=='float'){val=parseFloat(val)} else if(type=='int') {val=parseInt(val)};
        kSampler.inputs[name]=val;
    }
}

function createKsampler(data){
    const { 
        input: inputData,
    } = data;

    var KSampler={};
    var KSamplerInput={};
    var KSamplerId;
    for (let ele of inputData){
        if (ele.class_type==="KSampler"){
            KSampler=ele;
            KSamplerInput=ele.inputs;
            KSamplerId=ele.id;
            break;
        }
    }
    if (JSON.stringify(KSampler)==`{}`){
        const error_msg="KSampler not in inputData!! May cause unexpected UI error.";
        console.warn(error_msg);
        throw new Error(error_msg);
    };
    var KSamplerEle = document.createElement('details');
    KSamplerEle.innerHTML=`<summary>KSampler</summary>\n`;
    KSamplerEle.innerHTML+=`<div class="ksampler-config"> <div>`;
    KSamplerEle.style="margin-bottom: 10px;"
    const kconfigInput = KSamplerEle.querySelector(".ksampler-config");
    kconfigInput.style = `outline: 1px dashed gray;margin-bottom: 12px;margin-top: 12px;`

    let em = document.createElement('em');
    let emText = document.createElement('span');
    emText.innerText=`KSampler高级设置`;
    em.appendChild(emText);

    var steps=createNumSlide(
        `steps`, 50,
        (newSteps)=>updateKSampler(KSamplerId,"steps",'int',newSteps),
        0,100, 'int',
        null, null,
        false
    );
    var cfg=createNumSlide(
        `cfg`, 5.0,
        (newcfg)=>updateKSampler(KSamplerId,"cfg",'float',newcfg),
        0,100, 'float',
        null, null,
        false
    );
    var denoise=createNumSlide(
        `denoise`, 0.6,
        (newdenoise)=>updateKSampler(KSamplerId,"denoise",'float',newdenoise),
        0,1, 'float',
        null,null,
        false
    );

    let [div_sampler_name, selectDom1] = createSelectWithOptions(
        "sampler_name",
        Array.from(
            ['euler', 'euler_ancestral', 'heun', 'heunpp2', 'dpm_2', 'dpm_2_ancestral', 'lms', 'dpm_fast', 'dpm_adaptive', 'dpmpp_2s_ancestral', 'dpmpp_sde', 'dpmpp_sde_gpu', 'dpmpp_2m', 'dpmpp_2m_sde', 'dpmpp_2m_sde_gpu', 'dpmpp_3m_sde', 'dpmpp_3m_sde_gpu', 'ddpm', 'lcm', 'ddim', 'uni_pc', 'uni_pc_bh2'],
            o => {return {value:o, text:o}}
        ),
        'dpmpp_sde'
    )
    selectDom1.addEventListener('change', e=>{
        e.preventDefault();
        updateKSampler(KSamplerId, "sampler_name", 'string',selectDom1.value)
    })

    let [div_scheduler, selectDom2] = createSelectWithOptions(
        "scheduler",
        Array.from(
            ['ddim_uniform', 'simple', 'sgm_uniform', 'exponential', 'karras', 'normal'],
            o => {return {value:o, text:o}}
        ),
        'karras'
    )
    selectDom2.addEventListener('change', e=>{
        e.preventDefault();
        updateKSampler(KSamplerId, "scheduler", 'string',selectDom2.value)
    })

    //添加至总UI
    kconfigInput.appendChild(steps);
    kconfigInput.appendChild(cfg);
    kconfigInput.appendChild(denoise);
    kconfigInput.appendChild(div_sampler_name);
    kconfigInput.appendChild(div_scheduler);

    KSamplerEle.appendChild(kconfigInput);
    return KSamplerEle;
}

function createDownloadEles(){
    var dl_btn=document.createElement('button');
    dl_btn.className="download_btn";
    dl_btn.innerText="尚未生成图片";
    dl_btn.style.width="80%";
    dl_btn.addEventListener("click",()=>{
    if (dl_link.href!="#"){
            dl_link.dispatchEvent(new MouseEvent("click"));
        }
    })
    var dl_link=document.createElement('a');
    dl_link.className="download_link";
    dl_link.style="display:none";
    dl_link.href="#";
    document.body.appendChild(dl_link);
    return dl_btn;
}

function dlBtnBind(btn_name, img_src){
    const dl_btn=document.querySelector(".download_btn");
    const dl_link=document.querySelector(".download_link");
    dl_btn.innerText=btn_name;
    dl_link.href=img_src;
    dl_link.download=img_src;
}

function arraySwap(arr, i, j){
    var temp=arr[i];
    arr[i]=arr[j];
    arr[j]=temp
}

/**
 * @param {Object} obj
 * @param {String} obj.url omit
 * @param {String} obj.method omit
 * @param {Object} obj.headers request headers
 * @param {Object} obj.body
 * @param {String} windowPropertyName: window.property to store the response value
 */
function syncJsonRequest({url, method='POST', headers, body}, windowPropertyName){
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, false);
    for (const key of Object.keys(headers)){
        xhr.setRequestHeader(key,headers[key]);
    };
    xhr.addEventListener("readystatechange",(e)=>{
        if (xhr.readyState===4 && xhr.status >= 200 && xhr.status < 400){
            const serverResponse = JSON.parse(xhr.response);
            window['windowPropertyName']=serverResponse;
        } else {
            throw new Error("XHR request Error!")
        }
    })
    const requestBody = JSON.stringify(body);
    xhr.send(requestBody);
}

// create prompt options at right bottom
function createPromptSelections(){
    window.promptDict={
        background:"蓝",
        gender:"女",
        smile:"抿嘴笑",
        age:"儿童",
        suit:"商务正装"
    }

    const divContainer=document.createElement('div');
    divContainer.className="prompt-select-container";
    const [genderDiv, genderOptions] = createSelectWithOptions(
        "性别",
        Array.from(["男","女"],o=>{return {value:o, text:o}}),
        "女","gender"
    );
    const [backgroundDiv, backgroundOptions] = createSelectWithOptions(
        "背景颜色",
        Array.from(["红","蓝","白"],o=>{return {value:o, text:o}}),
        "蓝","background"
    );
    const [smileDiv, smileOptions] = createSelectWithOptions(
        "微笑程度",
        Array.from(["抿嘴笑","露齿笑","不笑"],o=>{return {value:o, text:o}}),
        "抿嘴笑","smile"
    );
    const [ageDiv, ageOptions] = createSelectWithOptions(
        "年龄段",
        Array.from(["儿童","少年","壮年","老年"],o=>{return {value:o, text:o}}),
        "儿童","age"
    );
    const [suitDiv, suitOptions] = createSelectWithOptions(
        "服饰",
        Array.from(["商务正装","校服正装"],o=>{return {value:o, text:o}}),
        "商务正装","suit"
    );

    [backgroundDiv,genderDiv,smileDiv,ageDiv,suitDiv].forEach(ele=>divContainer.appendChild(ele));

    for (const [key,optionEle] of Object.entries({
        background: backgroundOptions,
        gender: genderOptions,
        smile: smileOptions,
        age: ageOptions,
        suit: suitOptions
    })){
        optionEle.addEventListener('change',(event)=>{
            event.preventDefault();
            window.promptDict[key]=optionEle.value;
        })
    }

    return divContainer;
}

/** function to set positive prompt, will be invoked once initializing the page or click submitBtn if not use adavanced prompt*/
function valuePrompt(){

    const __gender=window.promptDict.gender;
    const __background=window.promptDict.background;
    const __smile=window.promptDict.smile;
    const __age=window.promptDict.age;
    const __suit=window.promptDict.suit;

    var gender, background, smile, suit;
    if (__gender=='男'){
        if (__age=='儿童' || __age=='少年'){gender='a boy'}
        else if (__age=='壮年'){gender='a man'}
        else {gender='an old man'}
    } else if (__gender=='女'){
        if (__age=='儿童' || __age=='少年'){gender='a girl'}
        else if (__age=='壮年'){gender='a woman'}
        else {gender='an old woman'}
    }

    if (__background=='红'){background='red'}
    else if (__background=='蓝'){background='blue'}
    else {background='white'}

    if (__smile=='抿嘴笑'){smile='smiling with lips pressed'}
    else if (__smile=='露齿笑'){smile='smiling with teeth showing'}
    else if (__smile=='不笑'){smile='not smiling'}

    if (__suit=='商务正装'){suit='formal suit'}
    else {suit='school uniform'}

    //TODO: fucntion to upload explicit template graphic.

    const prompt = (
        `A formal photo of ${gender} wearing (a ${suit}:1.5), `
        +`(${smile}:1.5), `
        +`and eyes directly looking at the camera `
        +`with ${background} color background; `
        +` face exposed under the left and right camera flashlights.`
    );
    console.log(`positive prompt ready to set: ${prompt}`)
    const __temp=__gender == "男"?"male":"female";

    // upload template graphic
    uploadTemplate({gender: __temp, background, suit});
    // 直接赋值给高级设置内的prompt设置，再触发textarea的change事件（图方便）
    try {
        window._positive_textarea.value=prompt;
        window._positive_textarea.dispatchEvent(new Event("input"));
    } catch (error) {
        console.log(error)
    }
}

/**
 * function to upload explicit template graphic.
 * @param {Object} obj
 * @param {String} obj.gender
 * @param {String} obj.background
 * @param {String} obj.suit
 */
function uploadTemplate({ gender, background, suit }){
    const templateImgEle = document.querySelector('[title=模板图]');

    // prevent from this function triggerred when the valuePrompt function invoked at the first time.
    if (!templateImgEle){return}
    templateImgEle.querySelector("img").src=(
        `${get_url()}/mixlab/templateGraphics`
        +`?background=${background}&gender=${gender}&suit=${suit}`
    );

}
