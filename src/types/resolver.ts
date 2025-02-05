import { CraftTextWidget } from "@/components/widgets/text-widget"
import { CraftSliderWidget } from "@/components/widgets/slider-widget"
import { CraftQuizWidget } from "@/components/widgets/quiz-widget"
import { CraftVideoWidget } from "@/components/widgets/video-widget"
import { CraftImageWidget } from "@/components/widgets/image-widget"

import { TextViewerComponent } from '@/components/widgets/text-widget';
import { Element } from "@craftjs/core"


export const editorResolver = {
    TextComponent: CraftTextWidget,
    SliderComponent: CraftSliderWidget,
    QuizComponent: CraftQuizWidget,
    VideoComponent: CraftVideoWidget,
    ImageComponent: CraftImageWidget,
    Element
}

export const viewerResolver = {
    TextComponent: TextViewerComponent,
    SliderComponent: CraftSliderWidget,
    QuizComponent: CraftQuizWidget,
    VideoComponent: CraftVideoWidget,
    ImageComponent: CraftImageWidget,
    Element
}