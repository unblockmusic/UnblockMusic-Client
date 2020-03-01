const CryptoJS = require("crypto-js");
const ID3Writer = require("browser-id3-writer");
const CORE_KEY = CryptoJS.enc.Hex.parse("687a4852416d736f356b496e62617857");
const META_KEY = CryptoJS.enc.Hex.parse("2331346C6A6B5F215C5D2630553C2728");
import {AudioMimeType, DetectAudioExt, GetArrayBuffer} from "./util"

export async function Decrypt(file) {

    const fileBuffer = await GetArrayBuffer(file);
    const dataView = new DataView(fileBuffer);

    if (dataView.getUint32(0, true) !== 0x4e455443 ||
        dataView.getUint32(4, true) !== 0x4d414446)
        return {status: false, message: "此ncm文件已损坏"};


    const keyDataObj = getKeyData(dataView, fileBuffer, 10);
    const keyBox = getKeyBox(keyDataObj.data);

    const musicMetaObj = getMetaData(dataView, fileBuffer, keyDataObj.offset);
    const musicMeta = musicMetaObj.data;

    let audioOffset = musicMetaObj.offset + dataView.getUint32(musicMetaObj.offset + 5, true) + 13;
    let audioData = new Uint8Array(fileBuffer, audioOffset);

    for (let cur = 0; cur < audioData.length; ++cur) audioData[cur] ^= keyBox[cur & 0xff];

    if (musicMeta.format === undefined) musicMeta.format = DetectAudioExt(audioData, "mp3");

    const mime = AudioMimeType[musicMeta.format];

    const artists = [];
    musicMeta.artist.forEach(arr => artists.push(arr[0]));
    if (musicMeta.format === "mp3")
        audioData = await writeID3(audioData, artists, musicMeta.musicName, musicMeta.album, musicMeta.albumPic);

    const musicData = new Blob([audioData], {type: mime});
    return {
        status: true,
        title: musicMeta.musicName,
        artist: artists.join(" & "),
        ext: musicMeta.format,
        album: musicMeta.album,
        picture: musicMeta.albumPic,
        file: URL.createObjectURL(musicData),
        mime: mime
    };
}

async function writeID3(audioData, artistList, title, album, picture) {
    const writer = new ID3Writer(audioData);
    writer.setFrame("TPE1", artistList)
        .setFrame("TIT2", title)
        .setFrame("TALB", album);
    if (picture !== "") {
        try {
            const img = await (await fetch(picture)).arrayBuffer();
            writer.setFrame('APIC', {
                type: 3,
                data: img,
                description: 'Cover'
            })
        } catch (e) {
            console.log("Fail to write cover image!");
        }
    }
    writer.addTag();
    return writer.arrayBuffer;
}

function getKeyData(dataView, fileBuffer, offset) {
    const keyLen = dataView.getUint32(offset, true);
    offset += 4;
    const cipherText = new Uint8Array(fileBuffer, offset, keyLen).map(
        uint8 => uint8 ^ 0x64
    );
    offset += keyLen;

    const plainText = CryptoJS.AES.decrypt(
        {ciphertext: CryptoJS.lib.WordArray.create(cipherText)},
        CORE_KEY,
        {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        }
    );

    const result = new Uint8Array(plainText.sigBytes);

    const words = plainText.words;
    const sigBytes = plainText.sigBytes;
    for (let i = 0; i < sigBytes; i++) {
        result[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }

    return {offset: offset, data: result.slice(17)};
}

function getKeyBox(keyData) {
    const box = new Uint8Array(Array(256).keys());

    const keyDataLen = keyData.length;

    let j = 0;

    for (let i = 0; i < 256; i++) {
        j = (box[i] + j + keyData[i % keyDataLen]) & 0xff;
        [box[i], box[j]] = [box[j], box[i]];
    }

    return box.map((_, i, arr) => {
        i = (i + 1) & 0xff;
        const si = arr[i];
        const sj = arr[(i + si) & 0xff];
        return arr[(si + sj) & 0xff];
    });
}

/**
 * @typedef {Object} MusicMetaType
 * @property {Number} musicId
 * @property {String} musicName
 * @property {[[String, Number]]} artist
 * @property {String} album
 * @property {"flac"|"mp3"} format
 * @property {String} albumPic
 */

function getMetaData(dataView, fileBuffer, offset) {
    const metaDataLen = dataView.getUint32(offset, true);
    offset += 4;
    if (metaDataLen === 0) {
        return {};
    }

    const cipherText = new Uint8Array(fileBuffer, offset, metaDataLen).map(
        data => data ^ 0x63
    );
    offset += metaDataLen;

    const plainText = CryptoJS.AES.decrypt({
            ciphertext: CryptoJS.enc.Base64.parse(
                CryptoJS.lib.WordArray.create(cipherText.slice(22)).toString(CryptoJS.enc.Utf8)
            )
        },
        META_KEY,
        {mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7}
    ).toString(CryptoJS.enc.Utf8);
    const labelIndex = plainText.indexOf(":");
    let result = JSON.parse(plainText.slice(labelIndex + 1));
    if (plainText.slice(0, labelIndex) === "dj") {
        result = result.mainMusic;
    }
    result.albumPic = result.albumPic.replace("http:", "https:");
    return {data: result, offset: offset};
}


