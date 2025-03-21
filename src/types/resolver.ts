import { ImageComponent } from "@/components/user/image"
import { TextComponent } from "@/components/user/text"
import { VideoComponent } from "@/components/user/video"
import { QuizComponent } from "@/components/user/quiz"
import { SimulationComponent } from "@/components/user/simulation"
import { Element } from "@craftjs/core"


export const editorResolver = {
    Image: ImageComponent,
    Text: TextComponent,
    Video: VideoComponent,
    Quiz: QuizComponent,
    Simulation: SimulationComponent,
    Element
}