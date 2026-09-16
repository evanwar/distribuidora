import { LocalizedTutorialText, TutorialStepDefinition } from '../models/tutorial.models';
import { tutorialSelector, TutorialSelectorName } from '../registry/tutorial-selectors';

export function copy(es: string, en = es): LocalizedTutorialText {
  return { es, en };
}

export function step(
  id: string,
  selector: TutorialSelectorName,
  title: LocalizedTutorialText,
  description: LocalizedTutorialText,
  options: Omit<TutorialStepDefinition, 'id' | 'selector' | 'title' | 'description'> = {},
): TutorialStepDefinition {
  return { id, selector: tutorialSelector(selector), title, description, ...options };
}
