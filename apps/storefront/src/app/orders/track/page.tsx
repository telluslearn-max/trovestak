import { Metadata } from "next";
import TrackingClient from "./TrackingClient";

export const metadata: Metadata = {
    title: "Track Order | Trovestak",
    description: "Track your electronic deployment in real-time.",
};

export default function TrackOrderPage() {
    return (
        <div className="bg-background">
            <TrackingClient />
        </div>
    );
}
