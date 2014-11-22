pants-observe
=============

[![License](http://img.shields.io/badge/license-MIT-red.svg?style=flat-square)](https://github.com/xinix-technology/pants-observe/blob/master/LICENSE)
[![Bower](http://img.shields.io/bower/v/xinix-technology/pants-observe.svg?style=flat-square)](https://github.com/xinix-technology/pants-observe)

pants-observe adalah sebuah pustaka untuk melakukan aktif observasi terhadap perubahan yang terjadi pada sebuah object dan akan memanggil sebuah fungsi callback jika perubahan terjadi. Hal tersebut diinginkan jika seorang developer menginginkan setiap mutasi yang terjadi pada sebuah object dapat memicu perubahan-perubahan di bagian program yang lain juga.

Meski berprefix pants, pants-observe dapat digunakan secara standalone tanpa menggunakan pants.

pants-observe juga menyediakan polyfill yang dibutuhkan dan dapat digunakan terpisah, yaitu:

- WeakMap polyfill (dan penambahan non-standard features) `js/weakmap.poly.js`
- Object.observe polyfill `js/observe.poly.js`

## Instalasi menggunakan bower

Untuk menggunakan pants-observe dapat melalui bower dengan menggunakan cli berikut ini:

```bash
bower install xinix-technology/pants-observe --save
```

Secara umum direktori pants-observe akan berada di dalam direktori `bower_components`. Apabila sebelumnya telah menggunakan perintah `bower init` pada direktori yang sama, maka perintah di atas akan mendaftarkan pants-observe sebagai salah satu dependency pada `bower.json`.

Lalu tambahkan `<script>` pada berkas html yang ingin menggunakan:

```html
<html>
  <head>
    <script type="text/javascript" src="bower_components/pants-observe/js/weakmap.poly.js"></script>
    <script type="text/javascript" src="bower_components/pants-observe/js/observe.poly.js"></script>
    <script type="text/javascript" src="bower_components/pants-observe/js/observe.js"></script>
  </head>
</html>
```

## Contoh penggunaan

Penggunaan pants-observe cukup simple, yang dibutuhkan sebagai argument adalah object yang akan di-observe, path dalam bentuk string yang menyatakan path pada object yang akan di-observe, dan sebuah fungsi callback yang akan dipanggil jika terjadi mutasi pada data.

```javascript
var data = {
  name: 'John Doe'
}

// start observing
var observable = pants.observe(data, 'name', function() {
  // this is callback
});

// do this if you want to remove observe
observable.disconnect();
```

