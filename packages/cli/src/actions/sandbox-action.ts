import { findProjectRootPath } from '../utils/find-project-root-path';

export async function sandboxAction() {
  console.log(findProjectRootPath());
}
