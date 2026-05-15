// /series foi mesclado em /sermons como visualização agrupada (?view=grouped).
// Mantemos este arquivo só pra redirect e não quebrar deep links antigos.

import { redirect } from "next/navigation";

export default function SeriesRedirectPage() {
  redirect("/sermons?view=grouped");
}
