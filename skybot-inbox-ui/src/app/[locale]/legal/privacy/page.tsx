'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      <Link href="/settings/legal">
        <Button variant="ghost" size="sm" className="gap-2 mb-4">
          <ArrowLeft size={16} />
          Volver a Configuración
        </Button>
      </Link>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <h1>Política de Privacidad</h1>
        <p className="text-sm text-muted-foreground">Última actualización: 25 de enero de 2026</p>

        <h2>1. Introducción</h2>
        <p>
          SkyBot Inbox ("nosotros", "nuestro" o "nos") opera una plataforma de mensajería para clientes que se integra con
          Instagram, Facebook Messenger y WhatsApp. Esta Política de Privacidad explica cómo recopilamos, usamos
          y protegemos su información cuando utiliza nuestros servicios.
        </p>

        <h2>2. Información que Recopilamos</h2>
        <p>Recopilamos los siguientes tipos de información:</p>
        <ul>
          <li><strong>Información de Cuenta:</strong> Dirección de correo electrónico, nombre y credenciales de autenticación</li>
          <li><strong>Datos de Mensajes:</strong> Mensajes enviados y recibidos a través de canales conectados (Instagram, Facebook, WhatsApp)</li>
          <li><strong>Datos de Conexión:</strong> Tokens OAuth para cuentas de redes sociales conectadas</li>
          <li><strong>Datos de Uso:</strong> Análisis y registros de actividad para mejorar nuestro servicio</li>
        </ul>

        <h2>3. Cómo Usamos Su Información</h2>
        <p>Usamos su información para:</p>
        <ul>
          <li>Proporcionar y mantener los servicios de nuestra plataforma de mensajería</li>
          <li>Autenticar y autorizar el acceso a canales conectados</li>
          <li>Procesar y enrutar mensajes entre usted y sus clientes</li>
          <li>Analizar patrones de uso para mejorar nuestro servicio</li>
          <li>Enviar notificaciones y actualizaciones relacionadas con el servicio</li>
        </ul>

        <h2>4. Compartir Datos</h2>
        <p>No vendemos ni alquilamos su información personal. Compartimos datos solo con:</p>
        <ul>
          <li><strong>Proveedores de Servicios:</strong> Meta (Facebook/Instagram), WhatsApp para funcionalidad de mensajería</li>
          <li><strong>Cumplimiento Legal:</strong> Cuando lo requiera la ley o para proteger nuestros derechos</li>
          <li><strong>Con Su Consentimiento:</strong> Cuando nos haya dado permiso explícito</li>
        </ul>

        <h2>5. Seguridad de Datos</h2>
        <p>
          Implementamos medidas de seguridad estándar de la industria para proteger su información:
        </p>
        <ul>
          <li>Cifrado en tránsito (HTTPS/TLS)</li>
          <li>Cifrado de contraseñas con bcrypt</li>
          <li>Tokens de acceso seguros con JWT</li>
          <li>Auditorías de seguridad regulares</li>
        </ul>

        <h2>6. Retención de Datos</h2>
        <p>
          Conservamos sus datos mientras su cuenta esté activa. Puede solicitar la eliminación de datos en cualquier momento
          a través de la configuración de su cuenta o contactándonos directamente.
        </p>

        <h2>7. Sus Derechos</h2>
        <p>Usted tiene derecho a:</p>
        <ul>
          <li>Acceder a sus datos personales</li>
          <li>Corregir información inexacta</li>
          <li>Solicitar la eliminación de datos</li>
          <li>Exportar sus datos (portabilidad de datos)</li>
          <li>Revocar consentimiento para el procesamiento de datos</li>
        </ul>

        <h2>8. Cookies y Seguimiento</h2>
        <p>
          Utilizamos cookies esenciales para la funcionalidad de autenticación y sesión. No utilizamos
          cookies de seguimiento de terceros con fines publicitarios.
        </p>

        <h2>9. Cambios a Esta Política</h2>
        <p>
          Podemos actualizar esta política ocasionalmente. Le notificaremos de cambios materiales mediante
          correo electrónico o una notificación destacada en nuestro servicio.
        </p>

        <h2>10. Contacto</h2>
        <div className="ui-card p-4 mt-4">
          <p className="mb-0">
            <strong>Para consultas sobre privacidad, contáctenos en:</strong>
          </p>
          <p className="mb-0">Email: privacy@skybot-inbox.com</p>
          <p className="mb-0">Dirección: Nexxa Systems, España</p>
        </div>
      </div>
    </div>
  );
}
