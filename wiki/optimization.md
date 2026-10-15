# Optimization

Variational optimization adjusts $\theta$ to lower the energy $E_\theta$. The choice of architecture, sampling method, and update rule all influence the result.

## Energy gradients

For real parameters, define the logarithmic derivative

$$
O_k(\boldsymbol{\sigma}) = \partial_{\theta_k}\log\Psi_\theta(\boldsymbol{\sigma}).
$$

When the required derivatives and expectations exist, the energy gradient is

$$
\frac{\partial E_\theta}{\partial\theta_k}
=2\,\operatorname{Re}\!\left[
\langle O_k^* E_{\mathrm{loc}}\rangle
-\langle O_k^*\rangle\langle E_{\mathrm{loc}}\rangle
\right].
$$

These expectations use the current variational sampling distribution. Finite sampling introduces noise in both the energy and its gradient.

## Stochastic reconfiguration

Stochastic reconfiguration uses the geometry of the variational states. For real parameters, a common metric is

$$
S_{kk'}=\operatorname{Re}\!\left[
\langle O_k^* O_{k'}\rangle
-\langle O_k^*\rangle\langle O_{k'}\rangle
\right].
$$

One update convention solves

$$
(S+\lambda I)\,\Delta\theta=-\eta\,\nabla_\theta E_\theta,
$$

where the step-size convention absorbs constant factors, and $\lambda$ regularizes the linear system. Other regularization schemes and equivalent force conventions are common. Complex parameterizations require care with the corresponding derivative conventions.

## What to record

Describe the optimizer, sample counts, regularization, stopping criteria, and final measurement procedure. Parameter count and runtime help contextualize a result, but energies are comparable only after the physical instance is fixed.

For practical implementations, consult the [NetKet documentation](https://netket.readthedocs.io/en/latest/).
