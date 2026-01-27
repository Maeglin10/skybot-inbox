export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Política de Privacidad</h2>
        <p className="text-sm text-muted-foreground">
          Última actualización: 27 de enero de 2026
        </p>
      </div>

      <div className="prose prose-sm max-w-none">
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">1. Información que Recopilamos</h3>
          <p className="text-muted-foreground">
            Recopilamos información que usted nos proporciona directamente, como cuando crea una cuenta, actualiza su perfil, o se comunica con nosotros. Esta información puede incluir:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Nombre y datos de contacto</li>
            <li>Información de la cuenta y credenciales</li>
            <li>Contenido de mensajes y comunicaciones</li>
            <li>Información de pago</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">2. Cómo Usamos su Información</h3>
          <p className="text-muted-foreground">
            Utilizamos la información que recopilamos para:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Proporcionar, mantener y mejorar nuestros servicios</li>
            <li>Procesar transacciones y enviar notificaciones relacionadas</li>
            <li>Responder a sus comentarios y preguntas</li>
            <li>Enviar información técnica y actualizaciones de seguridad</li>
            <li>Detectar, prevenir y abordar problemas técnicos</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">3. Compartir Información</h3>
          <p className="text-muted-foreground">
            No compartimos su información personal con terceros excepto en las siguientes circunstancias:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Con su consentimiento</li>
            <li>Para cumplir con obligaciones legales</li>
            <li>Con proveedores de servicios que nos ayudan a operar nuestro negocio</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">4. Seguridad de los Datos</h3>
          <p className="text-muted-foreground">
            Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger su información personal contra el acceso no autorizado, la alteración, divulgación o destrucción.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">5. Sus Derechos</h3>
          <p className="text-muted-foreground">
            Usted tiene derecho a:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Acceder a su información personal</li>
            <li>Corregir información inexacta</li>
            <li>Solicitar la eliminación de su información</li>
            <li>Oponerse al procesamiento de sus datos</li>
            <li>Solicitar la portabilidad de sus datos</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">6. Cookies y Tecnologías Similares</h3>
          <p className="text-muted-foreground">
            Utilizamos cookies y tecnologías similares para mejorar su experiencia, analizar el uso de nuestros servicios y personalizar el contenido. Puede controlar el uso de cookies a través de la configuración de su navegador.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">7. Contacto</h3>
          <p className="text-muted-foreground">
            Si tiene preguntas sobre esta Política de Privacidad, por favor contáctenos a través de privacy@nexxa.com
          </p>
        </section>
      </div>
    </div>
  );
}
