import { Camera } from "@capacitor/camera";
import { Network } from "@capacitor/network";
import { Geolocation } from "@capacitor/geolocation";
import { LocalNotifications } from "@capacitor/local-notifications";

window.CapacitorPlugins = {
    Camera,
    Network,
    Geolocation,
    LocalNotifications
};
