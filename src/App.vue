<template>

    <el-container id="app">
        <el-main>
            <x-upload v-on:handle_finish="showSuccess" v-on:handle_error="showFail"></x-upload>

            <el-row id="app-control">
                <el-row style="padding-bottom: 1em; font-size: 14px">
                    歌曲命名格式：
                    <el-radio label="1" name="format" v-model="download_format">原文件</el-radio>
                    <el-radio label="4" name="format" v-model="download_format">歌手-歌曲名</el-radio>
                    <el-radio label="2" name="format" v-model="download_format">歌曲名-歌手</el-radio>
                    <el-radio label="3" name="format" v-model="download_format">歌曲名</el-radio>
                </el-row>
                <el-row>
                    <el-button @click="handleDownloadAll" icon="el-icon-download" plain type="primary">下载全部</el-button>
                    <el-button @click="handleDeleteAll" icon="el-icon-delete" plain type="danger">删除全部</el-button>
                    <el-checkbox border style="margin-left: 1em" v-model="instant_download">立即保存</el-checkbox>
                </el-row>
            </el-row>
            <audio :autoplay="playing_auto" :src="playing_url" controls />

            <x-preview :table-data="tableData" :download_format="download_format"
                       v-on:music_changed="changePlaying"></x-preview>

        </el-main>
        <el-footer id="app-footer">
            <el-row style="padding-bottom: 0.2em; font-size:14px">
                当前版本：<span v-text="version"></span>
            </el-row>
            <el-row style="padding-bottom: 0.5em;">
                <span>Copyright &copy; 2019-2020</span>
            </el-row>
            <el-row>
                <a href="https://github.com/ix64/unlock-music/issues/new" target="_blank"><el-button icon="el-icon-s-promotion" size="mini" round type="primary" round>意见反馈</el-button></a> <a href="https://github.com/ix64/unlock-music" target="_blank"><el-button icon="el-icon-receiving" size="mini" round type="warning" round>开放源代码</el-button></a>
            </el-row>
        </el-footer>
    </el-container>

</template>

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
                playing_auto: false,
                download_format: '1',
                instant_download: false,
            }
        },
        created() {
            this.$nextTick(function () {
                this.finishLoad();
            });
        },
        methods: {
            async finishLoad() {
                const mask = document.getElementById("loader-mask");
                if (!!mask) mask.remove();
                let updateInfo;
                try {
                    const resp = await fetch("https://hxm108.github.io/app-version/app-ver.json", {
                        body: JSON.stringify({ Version: this.version })
                    });
                    updateInfo = await resp.json();
                } catch (e) {
                }
                if (!!updateInfo.Found) {
                    this.$notify.warning({
                        title: '欢迎使用',
                        message: '最近更新内容：</br>' +
                            '1. 优化UI</br>2. 新增 .wav .aac 支持',
                        dangerouslyUseHTMLString: true,
                        duration: 8000,
                        position: 'top-left'
                    });
                } else {
                    this.$notify.success({
                        title: '欢迎使用',
                        message: '最近更新内容：</br>' +
                            '1. 优化UI</br>2. 新增 .wav .aac 支持',
                        dangerouslyUseHTMLString: true,
                        duration: 8000,
                        position: 'top-left'
                    });
                }
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
                    console.error(errInfo, filename);
                }
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
