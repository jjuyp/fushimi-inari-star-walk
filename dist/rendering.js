import * as THREE from 'three';
import {Sky} from './vendor/Sky.js';
import {FXAAShader} from './vendor/FXAAShader.js';
import {SMAAPass} from './vendor/SMAAPass.js';
export function createLighting(scene,renderer){
  const sky=new Sky();sky.scale.setScalar(45000);scene.add(sky);
  const sun=new THREE.DirectionalLight('#fff0d5',2.7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.00008;sun.shadow.normalBias=.025;sun.shadow.autoUpdate=false;sun.shadow.needsUpdate=true;scene.add(sun,sun.target);
  const fill=new THREE.HemisphereLight('#c1d7ef','#52432d',.42);scene.add(fill);
  const pmrem=new THREE.PMREMGenerator(renderer),envScene=new THREE.Scene(),envSky=new Sky();envSky.scale.setScalar(450);envScene.add(envSky);
  let center=new THREE.Vector3(45,6,-5),extent=145,dusk=false,season='spring',lastShadow=new THREE.Vector3(Infinity,0,0),environment=null;
  const sunDirection=new THREE.Vector3();
  function atmosphere(){
    const elevation=dusk?11:season==='winter'?31:48,azimuth=dusk?-70:-115;
    sunDirection.setFromSphericalCoords(1,THREE.MathUtils.degToRad(90-elevation),THREE.MathUtils.degToRad(azimuth));
    for(const sky of [envSky,scene.children.find(o=>o===skyRef)]){const u=sky.material.uniforms;u.turbidity.value=dusk?4:1.8;u.rayleigh.value=season==='winter'?2:3.0;u.mieCoefficient.value=.006;u.mieDirectionalG.value=.78;u.sunPosition.value.copy(sunDirection);}
    sun.color.set(dusk?'#ffb673':season==='winter'?'#eff4ff':'#fff0d4');sun.intensity=dusk?2.1:2.7;fill.intensity=dusk?.25:.42;renderer.toneMappingExposure=dusk?.94:.87;
    if(environment)environment.dispose();environment=pmrem.fromScene(envScene,.035);scene.environment=environment.texture;scene.environmentIntensity=.3;
    scene.fog=new THREE.FogExp2(dusk?'#ad9477':season==='winter'?'#a3b4bf':'#9caeb2',.0007);
    sun.shadow.needsUpdate=true;
  }
  const skyRef=sky;
  function updateShadow(position,overview=false,force=false){
    const wanted=overview?new THREE.Vector3(85,20,-10):position.clone();
    if(!force&&overview===updateShadow.overview&&lastShadow.distanceTo(wanted)<14)return;
    center.copy(wanted);extent=overview?230:57;sun.target.position.copy(center);sun.position.copy(center).addScaledVector(sunDirection,400);
    Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent,near:10,far:820});sun.shadow.camera.updateProjectionMatrix();sun.shadow.needsUpdate=true;lastShadow.copy(wanted);updateShadow.overview=overview;
  }
  atmosphere();updateShadow(center,true,true);
  return{sun,fill,sky,setSeason(value){season=value;atmosphere();updateShadow(center,updateShadow.overview,true);},setDusk(value){dusk=value;atmosphere();updateShadow(center,updateShadow.overview,true);},updateShadow};
}

// Multisampled HDR scene + edge filtering + optional contact occlusion. Tone
// mapping and output conversion happen once, in the final fullscreen pass.
export class SceneRenderer{
  constructor(renderer,scene,camera){
    this.renderer=renderer;this.scene=scene;this.camera=camera;this.enabled=false;this.aaMethod='smaa';
    this.maxSamples=renderer.capabilities.maxSamples;this.samples=Math.min(4,this.maxSamples);
    this.target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:true,samples:this.samples,resolveDepthBuffer:false});
    // Ordinary depth testing stays on; only photography/contact AO needs a sampled depth copy.
    this.aaTarget=null;
    this.smaa=new SMAAPass();
    // Coverage masks/weights are bounded to [0,1]; 8-bit mask targets reduce
    // bandwidth. The scene and blended color remain linear half-float HDR.
    this.smaa._edgesRT.texture.type=THREE.UnsignedByteType;
    this.smaa._weightsRT.texture.type=THREE.UnsignedByteType;
    this.smaa._edgesRT.texture.format=THREE.RGFormat;
    this.smaa.deferBlend=true;
    // The official lookup images are embedded data URLs. Wait for decode so
    // the first visible frame already has complete edge-weight information.
    this.ready=Promise.all([this.smaa._areaTexture,this.smaa._searchTexture].map(async texture=>{await texture.image.decode();texture.needsUpdate=true;}));
    // Reuse the official shader's functions, integrating filtering before the
    // final output conversion rather than introducing a second tone-map pass.
    const fxaaFunctions=FXAAShader.fragmentShader.slice(0,FXAAShader.fragmentShader.lastIndexOf('void main()')).replace('uniform sampler2D tDiffuse;','').replace('uniform vec2 resolution;','').replace('varying vec2 vUv;','').replace('float _SubpixelBlending = 1.0;','float _SubpixelBlending = 0.65;');
    const samples=[];for(let i=0;i<10;i++){const a=i*2.39996,z=.15+.75*(i+.5)/10,r=Math.sqrt(1-z*z),scale=.25+.75*((i+.5)/10)**2;samples.push(new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,z).multiplyScalar(scale));}
    this.material=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{tColor:{value:this.target.texture},tDepth:{value:this.target.depthTexture},projection:{value:camera.projectionMatrix},inverseProjection:{value:camera.projectionMatrixInverse},samples:{value:samples},resolution:{value:new THREE.Vector2(1,1)},radius:{value:.8},strength:{value:0},antialias:{value:true}},
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader:`precision highp float;varying vec2 vUv;uniform sampler2D tColor;uniform sampler2D tDepth;uniform mat4 projection;uniform mat4 inverseProjection;uniform vec3 samples[10];uniform vec2 resolution;uniform float radius;uniform float strength;uniform bool antialias;
      ${fxaaFunctions}
      vec3 viewPos(vec2 uv,float depth){vec4 p=inverseProjection*vec4(uv*2.-1.,depth*2.-1.,1.);return p.xyz/p.w;}
      void main(){vec3 color=antialias?ApplyFXAA(tColor,1./resolution,vUv).rgb:texture2D(tColor,vUv).rgb;
      if(strength>0.){float depth=texture2D(tDepth,vUv).r;if(depth<.99999){vec3 p=viewPos(vUv,depth);vec3 normal=normalize(cross(dFdx(p),dFdy(p)));float noise=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);vec3 rv=vec3(cos(noise*6.283),sin(noise*6.283),0.);vec3 tangent=normalize(rv-normal*dot(rv,normal));mat3 basis=mat3(tangent,cross(normal,tangent),normal);float occ=0.;
        for(int i=0;i<10;i++){vec3 sp=p+basis*samples[i]*radius;vec4 projected=projection*vec4(sp,1.);vec2 uv=projected.xy/projected.w*.5+.5;if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.)continue;float dd=texture2D(tDepth,uv).r;float z=viewPos(uv,dd).z;float rangeCheck=smoothstep(0.,1.,radius/(abs(p.z-z)+.01));occ+=step(sp.z+.045,z)*rangeCheck;}color*=1.-occ*.1*strength;}}
        float l=dot(color,vec3(.2126,.7152,.0722));color=mix(vec3(l),color,1.055);gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
    const blend=this.smaa._materialBlend;
    this.outputBlend=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:this.smaa._uniformsBlend,vertexShader:blend.vertexShader,fragmentShader:blend.fragmentShader.replace(/}\s*$/,`float l=dot(gl_FragColor.rgb,vec3(.2126,.7152,.0722));gl_FragColor.rgb=mix(vec3(l),gl_FragColor.rgb,1.055);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`)});
    this.screen=new THREE.Scene();this.screenQuad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.material);this.screen.add(this.screenQuad);this.screenCamera=new THREE.Camera();this.resize();
  }
  resize(){const size=this.renderer.getDrawingBufferSize(new THREE.Vector2());this.target.setSize(size.x,size.y);this.aaTarget?.setSize(size.x,size.y);this.smaa.setSize(size.x,size.y);this.material.uniforms.resolution.value.copy(size);}
  setSamples(value){const samples=Math.min(value,this.maxSamples);if(samples===this.samples)return;this.samples=samples;this.target.samples=samples;this.target.dispose();}
  setAntialias(method){if(!['smaa','fxaa'].includes(method))throw Error('Unknown antialiasing method');this.aaMethod=method;}
  render(overview=false,photo=false){
    const r=this.renderer,useSmaa=photo||this.aaMethod==='smaa',ao=this.enabled||photo;
    if(ao&&!this.target.depthTexture){this.target.dispose();this.target.depthTexture=new THREE.DepthTexture(this.target.width,this.target.height,THREE.UnsignedIntType);this.target.resolveDepthBuffer=true;this.material.uniforms.tDepth.value=this.target.depthTexture;}
    if(!ao&&this.target.depthTexture){this.target.dispose();this.target.depthTexture.dispose();this.target.depthTexture=null;this.target.resolveDepthBuffer=false;this.material.uniforms.tDepth.value=null;}
    this.material.uniforms.radius.value=overview?2.3:.85;this.material.uniforms.strength.value=ao?.35:0;
    r.setRenderTarget(this.target);
    const depthEnabled=this.depthPrepass===true||(this.depthPrepass!==false&&overview&&r.getPixelRatio()>1);
    if(this.foliageDepth){this.foliageDepth.setActive(depthEnabled);if(depthEnabled){this.foliageDepth.sync();const autoClear=r.autoClear;r.autoClear=false;r.clear();r.render(this.foliageDepth.scene,this.camera);r.render(this.scene,this.camera);r.autoClear=autoClear;}else r.render(this.scene,this.camera);}else r.render(this.scene,this.camera);
    if(useSmaa){this.smaa.render(r,null,this.target);this.smaa._uniformsBlend.tColor.value=this.target.texture;}
    if(useSmaa&&ao){if(!this.aaTarget)this.aaTarget=new THREE.WebGLRenderTarget(this.target.width,this.target.height,{type:THREE.HalfFloatType,depthBuffer:false});r.setRenderTarget(this.aaTarget);this.smaa._fsQuad.material=this.smaa._materialBlend;this.smaa._fsQuad.render(r);}
    this.screenQuad.material=useSmaa&&!ao?this.outputBlend:this.material;
    this.material.uniforms.tColor.value=useSmaa&&ao?this.aaTarget.texture:this.target.texture;this.material.uniforms.antialias.value=!useSmaa;this.lastMethod=useSmaa?'smaa':'fxaa';
    r.setRenderTarget(null);r.render(this.screen,this.screenCamera);
    if(!ao&&this.aaTarget){this.aaTarget.dispose();this.aaTarget=null;}
  }
}
