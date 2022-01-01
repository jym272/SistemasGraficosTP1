'use strict';


export class CubeMap {
    constructor(gl) {
        this.gl = gl;
        this.crearTextura();

    }
    crearTextura(){
        const gl = this.gl;
        this.cubeTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubeTexture);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

    }
    cargarTexturasCubemap(random){
        const {gl} = this;
        switch (random) {
            case 0:
                import ('../images/skyBox/1/Left_1K_TEX.png')
                    .then((url) => {
                        this.loadCubemapFace(gl.TEXTURE_CUBE_MAP_POSITIVE_X, url.default);
                    });
                import ('../images/skyBox/1/Right_1K_TEX.png')
                    .then((url) => {
                        this.loadCubemapFace(gl.TEXTURE_CUBE_MAP_NEGATIVE_X,  url.default);
                    });
                import ('../images/skyBox/1/Up_1K_TEX.png')
                    .then((url) => {
                        this.loadCubemapFace(gl.TEXTURE_CUBE_MAP_POSITIVE_Y,  url.default);
                    });
                import ('../images/skyBox/1/Down_1K_TEX.png')
                    .then((url) => {
                        this.loadCubemapFace(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,  url.default);
                    });
                import ('../images/skyBox/1/Front_1K_TEX.png')
                    .then((url) => {
                        this.loadCubemapFace(gl.TEXTURE_CUBE_MAP_POSITIVE_Z,  url.default);
                    });
                import ('../images/skyBox/1/Back_1K_TEX.png')
                    .then((url) => {
                        this.loadCubemapFace(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,  url.default);
                    });
                break;
            case 1:
                import('../images/skyBox/2/Left_1K_TEX.png')
                    .then((url) => {
                        this.loadCubemapFace( gl.TEXTURE_CUBE_MAP_POSITIVE_X,  url.default);
                    });
                import('../images/skyBox/2/Right_1K_TEX.png')
                    .then((url) => {
                        this.loadCubemapFace( gl.TEXTURE_CUBE_MAP_NEGATIVE_X,  url.default);
                    });
                import('../images/skyBox/2/Up_1K_TEX.png')
                    .then((url) => {
                        this.loadCubemapFace( gl.TEXTURE_CUBE_MAP_POSITIVE_Y,  url.default);
                    });
                import('../images/skyBox/2/Down_1K_TEX.png')
                    .then((url) => {
                        this.loadCubemapFace( gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,  url.default);
                    });
                import('../images/skyBox/2/Front_1K_TEX.png')
                    .then((url) => {
                        this.loadCubemapFace( gl.TEXTURE_CUBE_MAP_POSITIVE_Z,  url.default);
                    });
                import('../images/skyBox/2/Back_1K_TEX.png')
                    .then((url) => {
                        this.loadCubemapFace( gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,  url.default);
                    });
                break;
            case 2:
                import('../images/skyBox/3/Left_1K_TEX.png')
                    .then((url) => {
                        this.loadCubemapFace( gl.TEXTURE_CUBE_MAP_POSITIVE_X,  url.default);
                    });
                import('../images/skyBox/3/Right_1K_TEX.png')
                    .then((url) => {
                        this.loadCubemapFace( gl.TEXTURE_CUBE_MAP_NEGATIVE_X,  url.default);
                    });
                import('../images/skyBox/3/Up_1K_TEX.png')
                    .then((url) => {
                        this.loadCubemapFace( gl.TEXTURE_CUBE_MAP_POSITIVE_Y,  url.default);
                    });
                import('../images/skyBox/3/Down_1K_TEX.png')
                    .then((url) => {
                        this.loadCubemapFace( gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,  url.default);
                    });
                import('../images/skyBox/3/Front_1K_TEX.png')
                    .then((url) => {
                        this.loadCubemapFace( gl.TEXTURE_CUBE_MAP_POSITIVE_Z,  url.default);
                    });
                import('../images/skyBox/3/Back_1K_TEX.png')
                    .then((url) => {
                        this.loadCubemapFace( gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,  url.default);
                    });
                break;
        }
    }
    loadCubemapFace(target, url) {
        const {gl, cubeTexture} = this;
        const image = new Image();
        image.src = url;
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
            gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        };
    }


}