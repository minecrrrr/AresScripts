const script = registerScript({
    name: "KeyFinder",
    version: "1.0",
    authors: ["minecrrrr"]
});

const MinecraftClient = Java.type("net.minecraft.client.MinecraftClient");
const ClientPlayerEntity = Java.type("net.minecraft.client.network.ClientPlayerEntity");
const World = Java.type('net.minecraft.world.World');
const Box = Java.type('net.minecraft.util.math.Box');
const Vec3d = Java.type('net.minecraft.util.math.Vec3d');


const HEALTH_THRESHOLD = 10.0;
const MINE_INTERVAL = 1200; 
const currentTime = Date.now();

let mineTicks = 0;
let feedTicks = 0;
let healthTriggered = false;
let isPlayerNearby = false;
let lastFeedTime = Date.now();
let lastLeave = Date.now();

function checkPlayers() {
    const mc = MinecraftClient.getInstance();
    const player = mc.player;
    const world = mc.world;

    if (!player || !world) {
        isPlayerNearby = false;
        return;
    }

    for (const entity of world.getPlayers()) {
        if (entity === player) continue;

        if (player.distanceTo(entity) <= 128) {
            isPlayerNearby = true;
            return;
        }
    }
    isPlayerNearby = false;
}

function sendChatMessage(message) {
    try {
        const player = MinecraftClient.getInstance().player;
        if (player && player.networkHandler) {
            if (message.startsWith("/")) {
                player.networkHandler.sendChatCommand(message.substring(1));
            } else {
                player.networkHandler.sendChatMessage(message);
            }
            return true;
        }
    } catch (e) {
        
    }
    return false;
}

script.registerModule({
    name: "KeyFinder",
    category: "Misc",
    description: "Автоматически ищет ключи на AresMine",
    visible: true
}, (module) => {
    const stopBaritone = () => sendChatMessage("#stop");
    const startBaritone = () => sendChatMessage("#mine chest barrel");
    const feed = () => sendChatMessage("/feed")
    const rtp = () => sendChatMessage("/rtp s")
    
    module.on("enable", () => {
        startBaritone();
        mineTicks = 201;
        feedTicks = 0;
        healthTriggered = false;
    });
    
    module.on("disable", () => {
        stopBaritone();
    });

    module.on("playerTick", () => {
        const player = MinecraftClient.getInstance().player;
        const world = MinecraftClient.getInstance().world;
        const currentTime = Date.now();
        checkPlayers();
        if (!player || !world) return;

        for (const entity of world.getPlayers()) {
        
            mineTicks++;
            if (mineTicks >= MINE_INTERVAL) {
                startBaritone();
                mineTicks = 0;
            }

            feedTicks++;
            if (currentTime - lastFeedTime >= 60000 ) {
                feed();
                lastFeedTime = currentTime;
            }
            
            const health = player.getHealth();
            if (health < HEALTH_THRESHOLD && !healthTriggered) {
                stopBaritone();
                rtp();
                startBaritone;

                healthTriggered = true;
                module.disable();
            }
            
            if (health > HEALTH_THRESHOLD + 4 && healthTriggered) {
                healthTriggered = false;
            
            }
            if (isPlayerNearby) {
                if (currentTime - lastLeave >= 250) {
                    rtp();
                    startBaritone();
                    lastLeave = currentTime
                }
            }

        }
    });
});