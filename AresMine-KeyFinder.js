const script = registerScript({
    name: "KeyFinder",
    version: "1.0",
    authors: ["minecrrrr"]
});

const MinecraftClient = Java.type('net.minecraft.client.MinecraftClient');
const ClientPlayerEntity = Java.type('net.minecraft.client.network.ClientPlayerEntity');
const World = Java.type('net.minecraft.world.World');
const Box = Java.type('net.minecraft.util.math.Box');
const Vec3d = Java.type('net.minecraft.util.math.Vec3d');

const autoMine = 600;
const currentTime = Date.now();

let feedTicks = 0;
let mineTicks = 0;
let healthTriggered = false;
let isPlayerNearby = false;
let lastFeedTime = Date.now();
let lastLeave = Date.now();

var LeaveRange

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
    settings: {
        autoLeave: Setting.boolean({
            name: "AutoLeave",
            default: true
        }),
        rangeToLeave: Setting.int({
            name: "Leave Range",
            default: 128.0,
            range: [16.0, 256.0],
            suffix: "blocks",
        }),
        actionAtLowHealth: Setting.choose({
            name: "Action at low health",
            default: "rtp s",
            choices: ["none", "rtp s", "rtp f", "spawn", "home"],
        }),
        homeName: Setting.text({
            name: "Home name",
            default: "default",
        }),
        minHealth: Setting.int({
            name: "Minimum health",
            default: 10,
            range: [1, 20],
            suffix: "health",
        }),
    }
}, (module) => {

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

        if (player.distanceTo(entity) <= LeaveRange) {
            isPlayerNearby = true;
            return;
        }
    }
    isPlayerNearby = false;
}

    const stopBaritone = () => sendChatMessage("%stop");
    const startBaritone = () => sendChatMessage("%mine chest barrel");
    const feed = () => sendChatMessage("/feed")
    const rtp = () => sendChatMessage("/rtp s")
    
    module.on("enable", () => {
        mineTicks = 601;
        startBaritone();
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
        
            LeaveRange = module.settings.rangeToLeave.value;

            mineTicks++;
            if (mineTicks >= autoMine) {
                startBaritone();
                mineTicks = 0;
            }

            feedTicks++;
            if (currentTime - lastFeedTime >= 60000 ) {
                feed();
                lastFeedTime = currentTime;
            }
            
            const health = player.getHealth();
            if (health < module.settings.minHealth.value && !healthTriggered) {
                stopBaritone();
                if (actionAtLowHealth != "home") {
                    sendChatMessage( "/" + module.settings.actionAtLowHealth.value );
                } else {
                    sendChatMessage( "/home " + module.settings.homeName.value )
                }
                startBaritone;

                healthTriggered = true;
                module.disable();
            }
            
            if (health > module.settings.minHealth.value + 4 && healthTriggered) {
                healthTriggered = false;
            
            }
            if (module.settings.autoLeave.value) {
                if (isPlayerNearby) {
                    if (currentTime - lastLeave >= 250) {
                        rtp();
                        startBaritone();
                        lastLeave = currentTime
                    }
                }
            }
        }
    });
});