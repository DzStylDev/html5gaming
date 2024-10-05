
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import * as THREE from 'three';

import { GLTFLoader } from "./jsm/loaders/GLTFLoader.js"
import { FBXLoader } from './jsm/loaders/FBXLoader.js';
import { TrackballControls } from './jsm/controls/TrackballControls.js';
import { PointerLockControls } from './jsm/controls/PointerLockControls.js';
import { TextGeometry } from './jsm/geometries/TextGeometry.js';
import { FontLoader } from './jsm/loaders/FontLoader.js';

let DIRECTIONS = ['z', 'q', 's', 'd']
let model_container = document.querySelector('#container3D')


let scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45,  window.innerWidth / window.innerHeight, 0.1, 1000)

camera.position.y = 1;
camera.position.z = 5;
camera.position.x = 0;

const renderer =  new THREE.WebGLRenderer({
    antialias: true,
	canvas: model_container
})

renderer.setClearColor("#250a64")
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.minDistance = 5;
controls.maxDistance = 6
controls.dampingFactor = 0.12
controls.enablePan = false
controls.maxPolarAngle = Math.PI / 2 - 0.05
controls.enableZoom = false
controls.update()

const controls2 = new TrackballControls(camera, renderer.domElement)
controls2.noRotate = true
controls2.noPan = true
controls2.noZoom = false
controls2.zoomSpeed = 1.5

const axeHelper = new THREE.AxesHelper(5)
// scene.add(axeHelper)


const textureLoader = new THREE.TextureLoader();
const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
directionalLight2.position.set(5, 10, 7.5);
directionalLight2.castShadow = true;
scene.add(directionalLight2);

const ambientLight2 = new THREE.AmbientLight(0x404040);
scene.add(ambientLight2);

const spotLight2 = new THREE.SpotLight(0xffffff);
spotLight2.position.set(10, 20, 10);
spotLight2.angle = Math.PI / 4;
spotLight2.penumbra = 0.1;
spotLight2.castShadow = true;
scene.add(spotLight2);

const character = new FBXLoader()
const characterGroup = new THREE.Group();


let fbxLoader = new FBXLoader()
function createCharacterControls(model, mixer, animationsMap, orbitControl, camera, currentAction) {
    const state = {
        toggleRun: true,
        currentAction: currentAction,
        walkDirection: new THREE.Vector3(),
        rotateAngle: new THREE.Vector3(0, 1, 0),
        rotateQuaternion: new THREE.Quaternion(),
        cameraTarget: new THREE.Vector3(),
        fadeDuration: 0.2,
        runVelocity: 5,
        walkVelocity: 2,
        orbitControl
    };
    

    updateCameraTarget(0, 0);
    

    function switchRunToggle() {
        state.toggleRun = !state.toggleRun;
    }

    function update(delta, keysPressed) {

        
        const directionPressed = DIRECTIONS.some(key => keysPressed[key] === true);

        let play = '';
        if (directionPressed && state.toggleRun) {
            play = 'Run';
        } else if (directionPressed) {
            play = "Start Walking"
        } else {
            play = "Idle To Braced Hang"
        }


        if (state.currentAction !== play) {

            fbxLoader.load(`../assets/model/Start Walking.fbx`, (a) => {
                mixer.clipAction(a.animations[0]).play()    
                action.setLoop(THREE.LoopRepeat, Infinity); 

            })
            state.currentAction = play;


        }




        mixer.update(delta);

        if (state.currentAction === 'Run' || state.currentAction === "Start Walking") {
            const angleYCameraDirection = Math.atan2(
                (model.position.x - camera.position.x),
                (model.position.z - camera.position.z)
            );
                const directionOffsetValue = directionOffset(keysPressed);


                state.rotateQuaternion.setFromAxisAngle(
                    state.rotateAngle, 
                    angleYCameraDirection + directionOffsetValue
                );
                model.quaternion.rotateTowards(state.rotateQuaternion, 0.2);    

                camera.getWorldDirection(state.walkDirection);
                state.walkDirection.y = 0;
                state.walkDirection.normalize();
                state.walkDirection.applyAxisAngle(state.rotateAngle, directionOffsetValue);

                const velocity = state.currentAction === 'Run' ? state.runVelocity : state.walkVelocity;

                const moveX = state.walkDirection.x * velocity * delta;
                const moveZ = state.walkDirection.z * velocity * delta;
                model.position.x += moveX;
                model.position.z += moveZ;  

                updateCameraTarget(moveX, moveZ);   
                updateCameraPosition()
                checkCollision(model)



            }
    }   
    
    function updateCameraPosition() {
    
        camera.lookAt(model.position);  
    }
   
    
    function updateCameraTarget(moveX, moveZ) {
        camera.position.x += moveX;
        camera.position.z += moveZ;
    
        state.cameraTarget.x = model.position.x;
        state.cameraTarget.y = model.position.y + 1;
        state.cameraTarget.z = model.position.z;
        controls.target = state.cameraTarget;
    }
    function directionOffset(keysPressed) {
        let directionOffset = 0
        let z = "z"
        let q = "q"
        let s = "s"
        let d = "d"


        if (keysPressed[z]) {
            if (keysPressed[q]) {
                directionOffset = Math.PI / 4; // z+q
            } else if (keysPressed[d]) {
                directionOffset = -Math.PI / 4; // z+d
            }
        } else if (keysPressed[s]) {
            if (keysPressed[q]) {
                directionOffset = Math.PI / 4 + Math.PI / 2; // s+q
            } else if (keysPressed[d]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2; // s+d
            } else {
                directionOffset = Math.PI; // S
            }
        } else if (keysPressed[q]) {
            directionOffset = Math.PI / 2; // q
        } else if (keysPressed[d]) {
            directionOffset = -Math.PI / 2; // d
        }
      

        return directionOffset;

        
    }

    return {
        switchRunToggle,
        update,
        updateCameraTarget,
        updateCameraPosition
    };
}
let characterControls


const animationsMap = new Map()
let clock = new THREE.Clock()

character.load('../assets/model/Ch24_nonPBR.fbx', function(model) { 

	model.scale.set(
		model.scale.x * 0.01,  
		model.scale.y * 0.01,  
		model.scale.z * 0.01  
	);
	model.position.set(0, 0, 0)

    model.rotation.y = Math.PI
	model.traverse(function (child) {
        if (child.isMesh) {
	

            child.castShadow = true;
            if (child.isSkinnedMesh) {
                child.skeleton.update();
                console.log('SkinnedMesh trouver:', child.name);

                
            }
 
            animate()
        }
    });

    characterGroup.add(model)

	scene.add(model)

    const gltAnimations = model.animations

    const mixer = new THREE.AnimationMixer(model)
    
    const fbxLoader = new FBXLoader();

    characterControls = new createCharacterControls(model, mixer, animationsMap, controls, camera,  'mixamo.com')

}, function(xhr){
	// console.log((xhr.loaded/xhr.total * 100) + "% loaded")
}, function(error){
	console.log('impossible de charger le modèle', error)
})

const WIDTH = 80;
const LENGTH = 80;

let floorTexture = textureLoader.load('../assets/texture/wood_planks_4k.blend/textures/wood_planks_diff_4k.jpg')
const planeGeometry = new THREE.PlaneGeometry(WIDTH, LENGTH, 512, 512);
const planematerial = new THREE.MeshStandardMaterial({
    map: floorTexture
});
const floor = new THREE.Mesh(planeGeometry, planematerial)

floor.receiveShadow = true;
floor.rotation.x = -Math.PI / 2;

scene.add(floor)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);    

const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(10, 10, 10);
spotLight.castShadow = true;
scene.add(spotLight);

async function callQuestions(){
    return fetch('questions.json').then(v => {
        return v.json()
    }).then(value => {
        return value.questions
    })
}
let objectQuestion = await callQuestions()
let currentIndex = 1
let currentQuestion = objectQuestion[`question${currentIndex}`][0].text


function createQuizz(groupCalcul, color, standPosition, reponse, planeGeometry, panelPosition){
    const standGeometry = new THREE.PlaneGeometry(groupCalcul[0], groupCalcul[1], groupCalcul[2]);
    const standMaterial = new THREE.MeshBasicMaterial({ color: "#" + color });
    const stand = new THREE.Mesh(standGeometry, standMaterial);
    stand.position.set(standPosition[0], standPosition[1], standPosition[2]);
    stand.rotation.set(5,0 ,0)
    scene.add(stand);

    const panelGeometry = new THREE.PlaneGeometry(planeGeometry[0], planeGeometry[1]);
    const panelMaterial = new THREE.MeshBasicMaterial({ color: "white", transparent: true, opacity: 0.5 });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(panelPosition[0], panelPosition[1], panelPosition[2]);
    scene.add(panel);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;

    context.fillStyle = "white";
    context.font = "Bold 36px Arial";

    context.fillText(reponse, 20, 50);

    const texture = new THREE.CanvasTexture(canvas);
    panel.material.map = texture;
    panel.material.needsUpdate = true;

    return {
        stand,
        panel,
        reponse: reponse,
        context
    }
}

renderer.shadowMap.enabled = true;

directionalLight.castShadow = true;
spotLight.castShadow = true;

character.castShadow = true; 
character.receiveShadow = true; 

const pointerControl = new PointerLockControls(camera, document.body);


const keys = {};


document.addEventListener('keydown', (event) => {
    if(event.shiftKey){
        characterControls.switchRunToggle()
} else {
        keys[event.key.toLowerCase()] = true;
    }
});
document.addEventListener('keyup', (event) => {
    keys[event.key.toLowerCase()] = false;  
});

let textMesh
let textMaterial
const fontLoader = new FontLoader()
let font
let nbrErr = 0
let score = 0


async function createText(scene, font, currentText) {
    
    const textGeometry = new TextGeometry(currentText, {
        font: font,
        size: 1,
        depth: 0.1,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 5
    });

    textMaterial = new THREE.MeshBasicMaterial({ color: "#fff" });
    textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(-9, 4, -15); // Position initiale du texte
    scene.add(textMesh);



}
let boxs = []

    let box1 = createQuizz([1, 2, 1], 'fff', [1, 0, -9], objectQuestion[`question${currentIndex}`][0].options.option1[0], [4, 2], [2, 2, -9])
    let box2 = createQuizz([1, 2, 1], 'fff', [6, 0, -9], objectQuestion[`question${currentIndex}`][0].options.option2[0], [4, 2], [7, 2, -9])
    let box3 = createQuizz([1, 2, 1], 'fff', [-4, 0, -9], objectQuestion[`question${currentIndex}`][0].options.option3[0], [4, 2], [-3, 2, -9])

    boxs.push(box1, box2, box3);
function createScore(score, font){
    const textGeometryScore = new TextGeometry(`score : ${score}`, {
        font: font,
        size: 0.6,
        depth: 0.0,
        curveSegments: 1,
        bevelEnabled: false,
        bevelThickness: 0.002,
        bevelSize: 0.001    ,
        bevelOffset: 0, 
        bevelSegments: 1
    });

    let textMaterialScore = new THREE.MeshBasicMaterial({ color: "#4477cf" });
    let textMeshScore = new THREE.Mesh(textGeometryScore, textMaterialScore);
    textMeshScore.position.set(0, 7, -15); // Position initiale du texte
    scene.add(textMeshScore);

    return textGeometryScore
}
function updateOptions(currentReponse){
    scene.remove(box1.panel, box2.panel, box3.panel)

    boxs[0].reponse = currentReponse.option1[0]
    boxs[1].reponse = currentReponse.option2[0]
    boxs[2].reponse = currentReponse.option3[0]
    
    box1 = createQuizz([1, 2, 1], 'fff', [1, 0, -9], boxs[0].reponse, [4, 2], [2, 2, -9])
    box2 = createQuizz([1, 2, 1], 'fff', [6, 0, -9], boxs[1].reponse, [4, 2], [7, 2, -9])
    box3 = createQuizz([1, 2, 1], 'fff', [-4, 0, -9], boxs[2].reponse, [4, 2], [-3, 2, -9])

}

fontLoader.load('../assets/fonts/droid_sans_bold.typeface.json', (droidFont) => {

    font = droidFont

   createText(scene, font, currentQuestion)

})



function fadeOut() {
    scene.remove(textMesh)
};
function updateText(scene, font, model, currentObject) {
    fadeOut()    

    createText(scene, font, currentObject)

}
function updateScore(score, font){
    let scoreText = createScore(score, font)
    scene.remove(scoreText)
}

function checkCollision(character) {
    const characterBox = new THREE.Box3().setFromObject(character);


    let boxBounding1 = new THREE.Box3().setFromObject(boxs[0].stand);
    let boxBounding2 = new THREE.Box3().setFromObject(boxs[1].stand);
    let boxBounding3 = new THREE.Box3().setFromObject(boxs[2].stand);


    let boxBoundings = [boxBounding1, boxBounding2, boxBounding3]


    boxBoundings.forEach(async (box, index) => {
        if (box.intersectsBox(characterBox)) {
            let correctAnwser = (Object.values(objectQuestion[`question${currentIndex}`][0].options).filter(element => element[1] === true))

          
            if(currentQuestion === objectQuestion[`question${currentIndex}`][0].text){
                
                
                if(score !== Number(Object.keys(objectQuestion)[Object.keys(objectQuestion).length - 1].split('')[8])){

                    if(boxs[index].reponse === correctAnwser[0][0]){
                        currentIndex++;
                        score++;
                        currentQuestion = objectQuestion[`question${currentIndex}`][0].text  
                        updateText(scene, font, character, currentQuestion)
                        updateOptions(objectQuestion[`question${currentIndex}`][0].options)
                        updateScore(score, font)
                    }  
                    
                }
              
            }
        }
    })

}

function animate() {

    const target = controls.target

    controls2.target.set(target.x, target.y, target.z)
    controls2.update()
    

    const delta = clock.getDelta();
    if(characterControls){
        characterControls.update(delta, keys)
    }
    controls.update()


    renderer.render(scene, camera);
    requestAnimationFrame(animate);

}


document.body.appendChild(renderer.domElement);
animate()

window.addEventListener('wheel', (event) => {
    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });
}, { passive: true });

