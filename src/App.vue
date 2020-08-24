<template>

    <el-container id="app">
        <el-main>
            <x-upload v-on:handle_error="showFail" v-on:handle_finish="showSuccess"></x-upload>

            <div id="app-control">
                <el-row>
                    <el-input style="width:290px" placeholder="URL" v-model="input" clearable prefix-icon="el-icon-link"></el-input>
                    <el-button @click="playing_url = input" style="margin-left: 1em"
                               circle icon="el-icon-caret-right" type="primary" size="mini">
                    </el-button>
                    <el-button @click="playing_url = none; input = none"
                               style="margin-left: 0.5em" circle icon="el-icon-switch-button" type="danger" size="mini">
                    </el-button>
                </el-row>
                <el-row style="font-size:12px;color:gray;padding-bottom: 2em;padding-top:0.8em">
                    播放URL地址
                </el-row>
                <el-row style="padding-bottom: 1em; font-size: 13px">
                    <el-radio-group v-model="download_format" name="format" size="small">
                        <el-radio-button label="4">原文件名</el-radio-button>
                        <el-radio-button label="1">歌手 - 歌曲名</el-radio-button>
                        <el-radio-button label="3">歌曲名 - 歌手</el-radio-button>
                        <el-radio-button label="2">歌曲名</el-radio-button>
                    </el-radio-group>
                </el-row>
                <el-row>
                    <el-button @click="handleDownloadAll" icon="el-icon-download" plain type="success">保存全部</el-button>
                    <el-popover placement="top"
                                trigger="hover"
                                width="160"
                                v-model="visible">
                        <p>移除所有导入的文件吗？</p>
                        <div style="text-align: right; margin: 0">
                            <el-button type="danger" size="mini" @click="handleDeleteAll">确定</el-button>
                        </div>
                    <el-button style="margin-left: 1em" slot="reference" icon="el-icon-delete" plain type="danger">移除全部</el-button>
                    </el-popover>
                    <el-tooltip class="item" effect="dark" placement="top-start">
                        <div slot="content">
                            批量导入时建议开启此选项。<br />
                            开启后，可防止内存不足。
                        </div>
                        <el-checkbox border style="margin-left: 1em" v-model="instant_download">立即保存</el-checkbox>
                    </el-tooltip>
                </el-row>
            </div>
            <audio :id="player" :autoplay="playing_auto" :src="playing_url" controls></audio>

            <x-preview :download_format="download_format" :table-data="tableData"
                       v-on:music_changed="changePlaying"></x-preview>

        </el-main>
        <el-footer id="app-footer">
            <el-row style="padding-bottom: 0.2em; font-size:14px">
                版本：<span v-text="version"></span>
            </el-row>
            <el-row style="padding-bottom: 1em;">
                <span>Copyright &copy; 2019-</span><span v-text="(new Date()).getFullYear()"></span>
            </el-row>
            <el-row>
                <a href="https://github.com/ix64/unlock-music/issues/new" target="_blank"><el-button icon="el-icon-chat-line-square" size="mini" round type="primary">意见反馈</el-button></a> <a href="https://github.com/ix64/unlock-music" target="_blank"><el-button icon="el-icon-receiving" size="mini" round type="warning">开放源代码</el-button></a>
            </el-row>
        </el-footer>
    </el-container>

</template>

s
<script>
    export default {
        data() {
            return {
                radio: 'download_format',
            };
        }
    }
</script>

<script>
    export default {
        data() {
            return {
                value: true,
            }
        }
    };
</script>

<script>

    import upload from "./component/upload"
    import preview from "./component/preview"
    import { DownloadBlobMusic, RemoveBlobMusic } from "./component/util"
    import config from "../package"
    export default {
        name: 'app',
        components: {
            xUpload: upload,
            xPreview: preview
        },
        data() {
            return {
                version: config.version,
                activeIndex: '1',
                tableData: [],
                playing_url: "",
                playing_auto: true,
                download_format: '1',
                instant_download: false,
                input: "",
                none: "",
            }
        },
        created() {
            this.$nextTick(function () {
                this.finishLoad();
            });
        },
        methods: {
            finishLoad() {
                const mask = document.getElementById("loader-mask");
                if (!!mask) mask.remove();
                this.$notify.success({
                    title: '欢迎使用',
                    message: '最近更新内容&nbsp;' + '(' + config.updateDate + ')' + '：</br>' + config.updateInfo,
                    dangerouslyUseHTMLString: true,
                    duration: 8000,
                    position: 'top-left'
                });
            },
            showSuccess(data) {
                if (data.status) {
                    if (this.instant_download) {
                        DownloadBlobMusic(data, this.download_format);
                        RemoveBlobMusic(data);
                    } else {
                        this.tableData.push(data);
                        this.$notify.success({
                            title: '成功',
                            message: data.title,
                            duration: 3000
                        });
                    }
                    if (process.env.NODE_ENV === 'production') {
                        let _rp_data = [data.title, data.artist, data.album];
                        window._paq.push(["trackEvent", "Unlock", data.rawExt + "," + data.mime, JSON.stringify(_rp_data)]);
                    }
                } else {
                    this.showFail(data.message, data.rawFilename + "." + data.rawExt)
                }
            },
            showFail(errInfo, filename) {
                this.$notify.error({
                    title: '失败',
                    message: errInfo + "，" + filename,
                    dangerouslyUseHTMLString: true,
                    duration: 6000
                });
                if (process.env.NODE_ENV === 'production') {
                    window._paq.push(["trackEvent", "Error", errInfo, filename]);
                }
                    console.error(errInfo, filename);
            },
            changePlaying(url) {
                this.playing_url = url;
                this.playing_auto = true;
            },
            handleDeleteAll() {
                this.tableData.forEach(value => {
                    RemoveBlobMusic(value);
                });
                this.tableData = [];
                this.playing_url = [];
            },

            handleDownloadAll() {
                let index = 0;
                let c = setInterval(() => {
                    if (index < this.tableData.length) {
                        DownloadBlobMusic(this.tableData[index], this.download_format);
                        index++;
                    } else {
                        clearInterval(c);
                    }
                }, 300);
            }
        },

    }


</script>

<style>

    #app {
        font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        padding-top: 30px;
    }

    #app-footer a {
        padding-left: 0.2em;
        padding-right: 0.2em;
    }

    #app-footer {
        text-align: center;
        font-size: small;
    }

    #app-control {
        padding-top: 1em;
        padding-bottom: 1em;
    }
</style>
