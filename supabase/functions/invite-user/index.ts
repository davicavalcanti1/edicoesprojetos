import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, preferred-timezone-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InviteUserRequest {
  email: string;
  full_name: string;
  role: "admin" | "user";
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verbose header logging for debugging
  const allHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    allHeaders[key] = key.toLowerCase() === "authorization" ? `${value.substring(0, 15)}...` : value;
  });
  console.log("[Invite-User] Incoming Headers:", allHeaders);
  console.log("[Invite-User] Auth Header Raw:", req.headers.get("Authorization") ? "PRESENT" : "MISSING");

  try {
    // Check required secrets - support both standard and VITE_ prefixed names
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("VITE_SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SEREVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("VITE_SUPABASE_ANON_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || Deno.env.get("VITE_RESEND_API_KEY");

    console.log("[Invite-User] Environment Check:", {
      url: supabaseUrl ? `${supabaseUrl.substring(0, 25)}...` : "MISSING",
      url_matches: supabaseUrl?.includes("zeaebtdbyscuenkybdiu"),
      anon_prefix: anonKey ? `${anonKey.substring(0, 10)}...` : "MISSING",
      service_role_prefix: serviceRoleKey ? `${serviceRoleKey.substring(0, 10)}...` : "MISSING",
      resend_present: !!resendApiKey,
      // Check for common typos or duplicates mentioned by user
      has_vite_prefixed: !!Deno.env.get("VITE_SUPABASE_URL"),
      has_typo_service_role: !!Deno.env.get("SUPABASE_SEREVICE_ROLE_KEY")
    });

    if (!supabaseUrl || !serviceRoleKey || !anonKey || !resendApiKey) {
      console.error("[Invite-User] MISSING REQUIRED SECRETS");
      return new Response(
        JSON.stringify({ error: "Configuração incompleta", details: "Faltam secrets no Supabase (URL, Keys ou Resend)." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Invite-User] Environment info:", {
      url: supabaseUrl?.substring(0, 20) + "...",
      anon_length: anonKey?.length,
      service_role_length: serviceRoleKey?.length,
      resend_key_present: !!resendApiKey,
      // Helper to check if they match the current project ID
      matches_config_id: supabaseUrl?.includes("zeaebtdbyscuenkybdiu")
    });

    const resend = new Resend(resendApiKey);

    // Get the authorization header to verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[Invite-User] Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create regular client to verify the requesting user
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get the requesting user
    console.log("[Invite-User] Verifying user token...");
    const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser();

    if (userError) {
      console.error("[Invite-User] getUser error:", userError.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userError.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!requestingUser) {
      console.error("[Invite-User] No user found for this token");
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "User not found" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Invite-User] User verified:", requestingUser.email);

    // Check if requesting user is admin
    const { data: isAdmin, error: rpcError } = await supabaseAdmin.rpc("is_tenant_admin", {
      _user_id: requestingUser.id,
    });

    if (rpcError) {
      console.error("[Invite-User] RPC error checking admin status:", rpcError.message);
      return new Response(
        JSON.stringify({ error: "Permission check failed", details: rpcError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isAdmin) {
      console.error("[Invite-User] User is not an admin:", requestingUser.id);
      return new Response(
        JSON.stringify({ error: "Acesso negado", message: "Apenas administradores podem convidar usuários." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get tenant info
    const { data: requestingProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("tenant_id")
      .eq("id", requestingUser.id)
      .single();

    if (profileError || !requestingProfile) {
      console.error("[Invite-User] Admin profile not found:", profileError?.message);
      return new Response(
        JSON.stringify({ error: "Admin profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Invite-User] Admin profile verified. Tenant:", requestingProfile.tenant_id);

    // Get tenant info for email
    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("name")
      .eq("id", requestingProfile.tenant_id)
      .single();

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { email, full_name, role } = body as InviteUserRequest;

    if (!email || !full_name) {
      console.error("[Invite-User] Missing email or full_name in request body");
      return new Response(
        JSON.stringify({ error: "Dados inválidos", message: "Email e nome completo são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tenant_id = requestingProfile.tenant_id;
    const tenantName = tenant?.name || "IMAGO";

    console.log(`Inviting user ${email} to tenant ${tenant_id}`);

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "email_exists",
          message: "Este email já está cadastrado.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a secure invite token
    const inviteToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store the invite in a pending_invites record (we'll use password_reset_tokens table or create invite)
    // For now, we'll use a temporary password and send magic link
    const tempPassword = crypto.randomUUID();

    // Create auth user with temporary password
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // We confirm email since we verify it ourselves
      user_metadata: {
        full_name,
        needs_password_setup: true,
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      if ((authError as any)?.code === "email_exists") {
        return new Response(
          JSON.stringify({
            success: false,
            error: "email_exists",
            message: "Este email já está cadastrado.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;
    const desiredRole = role || "user";

    console.log(`Created user ${userId}, setting up profile and role`);

    // Create profile
    const { error: upsertProfileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        tenant_id,
        full_name,
        email,
        is_active: true,
      }, { onConflict: "id" });

    if (upsertProfileError) {
      console.error("Profile error:", upsertProfileError);
    }

    // Set up role
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        tenant_id,
        role: desiredRole,
      });

    if (roleError) {
      console.error("Role error:", roleError);
    }

    // Generate password reset link so user can set their own password

    const SITE_URL =
      Deno.env.get("SITE_URL") || "https://ocorrencias.imagoradiologia.cloud";

    const { data: resetData, error: resetError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo: `${SITE_URL}/reset-password`,
        },
      });

    if (resetError) {
      throw resetError;
    }

    // resetData.properties.action_link -> link final para enviar por e-mail


    if (resetError) {
      console.error("Reset link error:", resetError);
      // Continue anyway, user can use "forgot password" later
    }

    // Get the action link for the email
    const resetLink = resetData?.properties?.action_link || "";

    console.log(`Sending invite email to ${email}`);

    // Send custom invite email via Resend
    const { error: emailError } = await resend.emails.send({
      from: "IMAGO Sistema <noreply@imagoradiologia.cloud>",
      to: [email],
      subject: `Convite para ${tenantName} - Sistema de Ocorrências`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Convite - ${tenantName}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #325C93 0%, #4a7ab8 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Ocorrências Imago</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Diagnóstico por Imagem</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 22px;">
                Olá, ${full_name}! 👋
              </h2>
              
              <p style="color: #555; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                Você foi convidado(a) para acessar o <strong>Sistema de Ocorrências Imago</strong>.
              </p>
              
              <p style="color: #555; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                Para começar, clique no botão abaixo para criar sua senha de acesso:
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #325C93 0%, #4a7ab8 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(50,92,147,0.3);">
                  Criar Minha Senha
                </a>
              </div>
              
              <p style="color: #888; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                Este link expira em <strong>7 dias</strong>. Se você não solicitou este convite, pode ignorar este email com segurança.
              </p>
              
              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #aaa; font-size: 12px; margin: 0; text-align: center;">
                Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                <a href="${resetLink}" style="color: #325C93; word-break: break-all;">${resetLink}</a>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} ${tenantName}. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("[Invite-User] Resend email error:", emailError);
      // If email fails, we should still return the user was created but mention the email error
      return new Response(
        JSON.stringify({
          success: true,
          user: { id: userId, email, full_name, role: desiredRole },
          message: `Usuário criado, mas houve um erro ao enviar o e-mail: ${emailError.message}. Verifique a configuração do Resend.`,
          email_error: emailError.message
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log audit event
    await supabaseAdmin.from("audit_logs").insert({
      tenant_id,
      user_id: requestingUser.id,
      action: "user_invite",
      entity_type: "user",
      entity_id: userId,
      details: {
        email,
        role: desiredRole,
        invited_by: requestingUser.email,
        email_sent: true,
      },
    });

    console.log(`[Invite-User] User ${email} invited successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: userId, email, full_name, role: desiredRole },
        message: `Convite enviado para ${email}. O usuário receberá um email para criar sua senha.`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[Invite-User] Critical error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
