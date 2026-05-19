-- Migration 032, alinha ai_enabled com plan='concilio'.
--
-- A regra do app passou a ser: promover pra Concílio liga o assistente
-- automaticamente (simétrico à regra inversa, que já existia). Antes dessa
-- mudança, vários usuários foram promovidos via /admin/users sem que
-- ai_enabled fosse setado, então o botão de exegese pedia ativação manual
-- pra eles. Aqui corrigimos o estado retroativamente.

update public.profiles
  set ai_enabled = true
  where plan = 'concilio'
    and ai_enabled = false;
