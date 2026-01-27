'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsAndConditionsPage() {
  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      <Link href="/settings/legal">
        <Button variant="ghost" size="sm" className="gap-2 mb-4">
          <ArrowLeft size={16} />
          Volver a Configuración
        </Button>
      </Link>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <h1>Términos y Condiciones</h1>
        <p className="text-sm text-muted-foreground">Última actualización: 25 de enero de 2026</p>

        <h2>1. Aceptación de Términos</h2>
        <p>
          Al acceder y usar SkyBot Inbox ("el Servicio"), usted acepta estar sujeto a estos Términos y Condiciones.
          Si no está de acuerdo con alguna parte de estos términos, no debe usar nuestro servicio.
        </p>

        <h2>2. Descripción del Servicio</h2>
        <p>
          SkyBot Inbox proporciona una plataforma de gestión de mensajería unificada que integra múltiples canales
          de comunicación incluyendo Instagram, Facebook Messenger y WhatsApp Business. El servicio permite a los
          usuarios:
        </p>
        <ul>
          <li>Centralizar mensajes de múltiples plataformas en una sola interfaz</li>
          <li>Gestionar conversaciones con clientes de manera eficiente</li>
          <li>Automatizar respuestas mediante agentes AI</li>
          <li>Analizar métricas de comunicación y rendimiento</li>
        </ul>

        <h2>3. Registro de Cuenta</h2>
        <p>
          Para usar el Servicio, debe crear una cuenta proporcionando información precisa y completa.
          Usted es responsable de:
        </p>
        <ul>
          <li>Mantener la confidencialidad de sus credenciales de cuenta</li>
          <li>Todas las actividades que ocurran bajo su cuenta</li>
          <li>Notificarnos inmediatamente de cualquier uso no autorizado</li>
        </ul>

        <h2>4. Uso Aceptable</h2>
        <p>
          Al usar nuestro Servicio, usted acepta NO:
        </p>
        <ul>
          <li>Violar ninguna ley local, nacional o internacional aplicable</li>
          <li>Enviar spam, contenido malicioso o mensajes no solicitados</li>
          <li>Hacerse pasar por otra persona o entidad</li>
          <li>Interferir o interrumpir el Servicio o servidores conectados</li>
          <li>Intentar obtener acceso no autorizado a cualquier parte del Servicio</li>
          <li>Usar el Servicio para acosar, abusar o dañar a otros</li>
        </ul>

        <h2>5. Integraciones de Terceros</h2>
        <p>
          El Servicio se integra con plataformas de terceros (Meta, WhatsApp). Su uso de estas integraciones
          también está sujeto a los términos y políticas de esas plataformas. No somos responsables de cambios
          en las APIs o políticas de terceros que puedan afectar la funcionalidad del servicio.
        </p>

        <h2>6. Planes de Suscripción y Facturación</h2>
        <h3>6.1 Planes Disponibles</h3>
        <ul>
          <li><strong>Starter:</strong> Plan básico con características limitadas</li>
          <li><strong>Pro:</strong> Plan profesional con características avanzadas</li>
          <li><strong>Enterprise:</strong> Plan empresarial con características completas y soporte prioritario</li>
        </ul>

        <h3>6.2 Facturación</h3>
        <ul>
          <li>Las suscripciones se facturan mensualmente por adelantado</li>
          <li>Todos los pagos no son reembolsables salvo que lo requiera la ley</li>
          <li>Los precios pueden cambiar con aviso de 30 días</li>
          <li>La renovación automática puede cancelarse en cualquier momento</li>
        </ul>

        <h2>7. Propiedad Intelectual</h2>
        <p>
          El Servicio y su contenido original, características y funcionalidad son propiedad de SkyBot Inbox
          y están protegidos por derechos de autor internacionales, marcas registradas y otras leyes de
          propiedad intelectual.
        </p>

        <h2>8. Limitación de Responsabilidad</h2>
        <p>
          En ningún caso SkyBot Inbox será responsable de daños indirectos, incidentales, especiales,
          consecuentes o punitivos, incluida la pérdida de beneficios, datos, uso, fondo de comercio u
          otras pérdidas intangibles.
        </p>

        <h2>9. Garantías</h2>
        <p>
          El Servicio se proporciona "TAL CUAL" y "SEGÚN DISPONIBILIDAD" sin garantías de ningún tipo,
          expresas o implícitas. No garantizamos que el Servicio será:
        </p>
        <ul>
          <li>Ininterrumpido o libre de errores</li>
          <li>Seguro o libre de virus</li>
          <li>Cumplirá con sus requisitos específicos</li>
        </ul>

        <h2>10. Terminación</h2>
        <p>
          Podemos terminar o suspender su cuenta inmediatamente, sin previo aviso o responsabilidad,
          por cualquier motivo, incluyendo pero no limitado a la violación de los Términos.
        </p>

        <h2>11. Modificaciones</h2>
        <p>
          Nos reservamos el derecho de modificar estos términos en cualquier momento. Le notificaremos
          de cambios materiales publicando los nuevos términos en esta página. Su uso continuado del
          Servicio después de dichos cambios constituye su aceptación de los nuevos términos.
        </p>

        <h2>12. Ley Aplicable</h2>
        <p>
          Estos Términos se regirán e interpretarán de acuerdo con las leyes de España, sin tener en
          cuenta sus disposiciones sobre conflictos de leyes.
        </p>

        <h2>13. Resolución de Disputas</h2>
        <p>
          Cualquier disputa que surja de o en relación con estos Términos se resolverá primero mediante
          negociación de buena fe. Si no se puede resolver, las disputas se someterán a arbitraje
          vinculante en España.
        </p>

        <h2>14. Contacto</h2>
        <div className="ui-card p-4 mt-4">
          <p className="mb-0">
            <strong>Para preguntas sobre estos términos, contáctenos en:</strong>
          </p>
          <p className="mb-0">Email: legal@skybot-inbox.com</p>
          <p className="mb-0">Dirección: Nexxa Systems, España</p>
          <p className="mb-0">Soporte: support@skybot-inbox.com</p>
        </div>
      </div>
    </div>
  );
}
