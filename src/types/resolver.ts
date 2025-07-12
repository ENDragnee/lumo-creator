import { renderCanvas } from "@/components/canvas/RenderCanvas"; // 1. ADD this import
import { ImageComponent } from "@/components/editor-components/ImageComponent";
import { TextComponent } from "@/components/editor-components/TextComponent";
import { VideoComponent } from "@/components/editor-components/VideoComponent";
import { SimulationComponent } from "@/components/editor-components/SimulationComponent";
import { HeaderComponent } from "@/components/user/HeaderComponent";
import { FooterComponent } from "@/components/user/FooterComponent";
import { SliderComponent } from '@/components/editor-components/SliderComponent';
import { QuizComponent } from '@/components/editor-components/QuizComponent';
import { ContainerComponent } from "@/components/editor-components/ContainerComponent";

export const editorResolver = {
  renderCanvas: renderCanvas,
  Image: ImageComponent,
  TextComponent: TextComponent,
  ContainerComponent: ContainerComponent,
  Video: VideoComponent,
  Quiz: QuizComponent,
  Simulation: SimulationComponent,
  Slider: SliderComponent,
  Header: HeaderComponent,
  Footer: FooterComponent,
};
